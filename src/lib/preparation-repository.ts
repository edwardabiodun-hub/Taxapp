import type { PreparationStatus } from "@/domain/tax-readiness";
import {
  createPreparationRecord,
  type PreparationRecord,
} from "@/domain/preparations";
import {
  isSubmissionEventValid,
  isUserSubmissionEvidenceValid,
  isValidTimestamp,
  type SubmissionEvent,
} from "@/domain/submissions";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import {
  db,
  type LocalDeclaration,
  type ExportPackageRecord,
  type StoredPreparation,
} from "@/lib/local-db";

const allowedTransitions: Readonly<
  Record<PreparationStatus, readonly PreparationStatus[]>
> = {
  draft: ["draft", "ready_for_review"],
  ready_for_review: ["ready_for_review", "exported"],
  exported: ["exported", "user_submitted"],
  user_submitted: ["user_submitted", "authority_confirmed"],
  authority_confirmed: ["authority_confirmed"],
};

const initialStatuses: readonly PreparationStatus[] = [
  "draft",
];

export function isValidPreparationStatusTransition(
  from: PreparationStatus | undefined,
  to: PreparationStatus,
): boolean {
  if (from === undefined) return initialStatuses.includes(to);
  return allowedTransitions[from].includes(to);
}

export async function savePreparation(preparation: PreparationRecord): Promise<void> {
  await db.transaction("rw", db.preparations, async () => {
    const existing = await db.preparations.get(preparation.id);
    assertValidPreparationSave(existing, preparation);

    await db.preparations.put(buildStoredPreparation(existing, preparation));
  });
}

/**
 * Persists a lifecycle change and its immutable evidence in one Dexie
 * transaction. A failed event append rolls back the preparation update too.
 */
export async function savePreparationAndAppendSubmissionEvent(
  preparation: PreparationRecord,
  event: SubmissionEvent,
): Promise<void> {
  await savePreparationAndAppendSubmissionEventWithExportPackages(preparation, event, []);
}

/**
 * Persists export metadata, the preparation lifecycle update, and its
 * immutable event in one transaction. A failure leaves none of the three
 * records behind.
 */
export async function savePreparationAndAppendSubmissionEventWithExportPackages(
  preparation: PreparationRecord,
  event: SubmissionEvent,
  exportPackages: readonly ExportPackageRecord[],
): Promise<void> {
  await db.transaction("rw", db.preparations, db.submissionEvents, db.exportPackages, async () => {
    const existing = await db.preparations.get(preparation.id);
    assertValidPreparationSave(existing, preparation, event, exportPackages);

    if (event.preparationId !== preparation.id || !isSubmissionEventValid(event, { requireEvidence: true })) {
      throw new Error("Submission event evidence is invalid.");
    }
    if (await db.submissionEvents.get(event.id)) {
      throw new Error("Submission events are immutable and cannot be overwritten.");
    }
    for (const exportPackage of exportPackages) {
      if (exportPackage.preparationId !== preparation.id || exportPackage.notSubmitted !== true) {
        throw new Error("Export metadata does not match the preparation.");
      }
    }

    await db.preparations.put(buildStoredPreparation(existing, preparation));
    await db.submissionEvents.add(event);
    for (const exportPackage of exportPackages) {
      await db.exportPackages.put(exportPackage);
    }
  });
}

export async function getPreparation(
  id: string,
): Promise<PreparationRecord | undefined> {
  const stored = await db.preparations.get(id);
  return stored ? stripSyncMetadata(stored) : undefined;
}

export async function listPreparations(): Promise<PreparationRecord[]> {
  const stored = await db.preparations.toArray();
  return stored
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(stripSyncMetadata);
}

export async function appendSubmissionEvent(event: SubmissionEvent): Promise<void> {
  await db.transaction("rw", db.preparations, db.submissionEvents, async () => {
    const preparation = await db.preparations.get(event.preparationId);
    if (!preparation) {
      throw new Error("Submission event requires an existing preparation.");
    }
    if (preparation.status === "authority_confirmed") {
      throw new Error("Authority-confirmed preparations are immutable.");
    }
    if (!isSubmissionEventValid(event, { requireEvidence: true })) {
      throw new Error("Submission event evidence is invalid.");
    }
    assertLifecycleEvent(stripSyncMetadata(preparation), event);

    const existing = await db.submissionEvents.get(event.id);
    if (existing) {
      throw new Error("Submission events are immutable and cannot be overwritten.");
    }

    await db.submissionEvents.add(event);
  });
}

export async function migrateLegacyDeclarationsToPreparations(
  declarations: readonly LocalDeclaration[],
): Promise<void> {
  await db.transaction("rw", db.preparations, async () => {
    for (const declaration of declarations) {
      const migrated = migrateLegacyDeclaration(declaration);
      const existing = await db.preparations.get(migrated.id);

      if (existing?.status === "authority_confirmed") {
        continue;
      }

      if (existing && (existing.pendingSync || existing.updatedAt >= migrated.updatedAt)) {
        continue;
      }

      const lifecycle = getMigratedPreparationLifecycle(existing?.status, migrated);
      if (!lifecycle) {
        continue;
      }

      for (const preparation of lifecycle) {
        await db.preparations.put({
          ...preparation,
          createdAt: existing?.createdAt ?? preparation.createdAt,
          pendingSync: declaration.pendingSync,
          ...(declaration.pendingSync || !declaration.syncedAt
            ? {}
            : { syncedAt: declaration.syncedAt }),
        });
      }
    }
  });
}

export function migrateLegacyDeclaration(record: LocalDeclaration): PreparationRecord {
  const status: PreparationStatus = record.status === "draft"
    ? "draft"
    : "ready_for_review";
  const jurisdictionCode = record.country.trim().toLowerCase() === "ng"
    ? "NG"
    : record.country.trim().toUpperCase();

  return createPreparationRecord(
    {
      id: record.id,
      jurisdictionCode,
      taxYear: record.taxYear,
      ruleProfileVersion: "",
      status,
       formData: {
         ...record.formData,
         country: record.country,
         documents: record.documents.map((document, index) => ({
           id: `legacy-${record.id}-${index}`,
           name: document.name,
           size: document.size,
           type: document.type,
           category: "legacy",
         })),
       },
      confirmedReceiptIds: [],
      confirmedReceiptInputs: {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
    getJurisdictionCapability(jurisdictionCode),
  );
}

export async function listPendingPreparations(): Promise<StoredPreparation[]> {
  return db.preparations.where("pendingSync").equals(1).toArray();
}

export async function markPreparationSynced(
  expected: PreparationRecord | StoredPreparation,
  syncedAt = new Date().toISOString(),
): Promise<boolean> {
  return db.transaction("rw", db.preparations, async () => {
    const current = await db.preparations.get(expected.id);
    if (
      !current ||
      !current.pendingSync ||
      serializePreparationSnapshot(current) !== serializePreparationSnapshot(expected)
    ) {
      return false;
    }

    await db.preparations.update(expected.id, { pendingSync: false, syncedAt });
    return true;
  });
}

export async function savePreparationFromSync(
  preparation: PreparationRecord,
  syncedAt = new Date().toISOString(),
): Promise<void> {
  await db.transaction("rw", db.preparations, async () => {
    const existing = await db.preparations.get(preparation.id);
    if (existing?.status === "authority_confirmed") {
      return;
    }
    if (
      existing &&
      (existing.pendingSync || existing.updatedAt >= preparation.updatedAt)
    ) {
      return;
    }
    const imported = downgradeUnvalidatedSyncStatus(preparation);
    const lifecycle = getMigratedPreparationLifecycle(existing?.status, imported);
    if (!lifecycle) {
      return;
    }
    assertAuthorityConfirmation(imported);

    for (const lifecyclePreparation of lifecycle) {
      await db.preparations.put({
        ...lifecyclePreparation,
        createdAt: existing?.createdAt ?? lifecyclePreparation.createdAt,
        pendingSync: false,
        syncedAt,
      });
    }
  });
}

function assertValidPreparationSave(
  existing: StoredPreparation | undefined,
  preparation: PreparationRecord,
  event?: SubmissionEvent,
  exportPackages: readonly ExportPackageRecord[] = [],
): void {
  if (existing?.status === "authority_confirmed") {
    throw new Error("Authority-confirmed preparations are immutable.");
  }

  if (
    event === undefined &&
    (preparation.status === "user_submitted" || preparation.status === "authority_confirmed")
  ) {
    throw new Error(
      "User submission and authority confirmation must be validated by SubmissionService.",
    );
  }

  if (!isValidPreparationStatusTransition(existing?.status, preparation.status)) {
    throw new Error(
      `Invalid preparation status transition from ${existing?.status ?? "new"} to ${preparation.status}.`,
    );
  }
  assertAuthorityConfirmation(preparation);
  if (event) assertLifecycleEvent(preparation, event, exportPackages);
}

function assertAuthorityConfirmation(preparation: PreparationRecord): void {
  if (
    preparation.status === "authority_confirmed" &&
    (!preparation.authorityConfirmation.authorityReference.trim() ||
      !isValidTimestamp(preparation.authorityConfirmation.confirmedAt))
  ) {
    throw new Error("Authority confirmation requires a valid authority reference and timestamp.");
  }
}

function assertLifecycleEvent(
  preparation: PreparationRecord,
  event: SubmissionEvent,
  exportPackages: readonly ExportPackageRecord[] = [],
): void {
  if (!event.evidence) {
    throw new Error("New submission events require explicit evidence.");
  }

  if (preparation.status === "exported") {
    if (
      event.type !== "exported" ||
      event.actor !== "system" ||
      event.evidence.source !== "filesmart-export" ||
      event.evidence.reference !== `${preparation.id}:${event.timestamp}` ||
      exportPackages.length === 0 ||
      exportPackages.some((record) => record.generatedAt !== event.timestamp)
    ) {
      throw new Error("Exported preparations require a system export event.");
    }
    return;
  }

  if (preparation.status === "user_submitted") {
    if (
      event.type !== "user_submitted" ||
      event.actor !== "user" ||
      !event.userEvidence ||
      event.evidence.source !== "user-submission" ||
      !isUserSubmissionEvidenceValid(event.userEvidence, event.timestamp)
    ) {
      throw new Error("User submission requires explicit validated evidence.");
    }
    return;
  }

  if (
    preparation.status === "authority_confirmed" &&
    (event.type !== "authority_confirmed" ||
      event.actor !== "authority" ||
      event.evidence.source !== "authority-confirmation" ||
      event.evidence.reference !== event.authorityReference ||
      event.authorityReference !== preparation.authorityConfirmation.authorityReference ||
      preparation.authorityConfirmation.confirmedAt !== event.timestamp)
  ) {
    throw new Error("Authority confirmation evidence does not match the preparation.");
  }

  throw new Error("Submission events require an explicit lifecycle transition.");
}

function buildStoredPreparation(
  existing: StoredPreparation | undefined,
  preparation: PreparationRecord,
): StoredPreparation {
  return {
    ...preparation,
    createdAt: existing?.createdAt ?? preparation.createdAt,
    updatedAt:
      existing && existing.updatedAt > preparation.updatedAt
        ? existing.updatedAt
        : preparation.updatedAt,
    pendingSync: true,
  };
}

function getMigratedPreparationLifecycle(
  from: PreparationStatus | undefined,
  preparation: PreparationRecord,
): readonly PreparationRecord[] | undefined {
  const statuses: readonly PreparationStatus[] = [
    "draft",
    "ready_for_review",
    "exported",
    "user_submitted",
    "authority_confirmed",
  ];
  const targetIndex = statuses.indexOf(preparation.status);
  if (targetIndex < 0) return undefined;

  if (from === undefined) {
    // A first-time legacy/sync record must materialize the local lifecycle one
    // valid transition at a time. This also preserves explicit authority
    // evidence without treating the legacy status label as proof by itself.
    return statuses
      .slice(0, targetIndex + 1)
      .map((status) => preparationAtStatus(preparation, status));
  }

  const fromIndex = statuses.indexOf(from);
  if (fromIndex < 0 || targetIndex < fromIndex) return undefined;
  if (targetIndex === fromIndex) return [preparation];

  return statuses
    .slice(fromIndex + 1, targetIndex + 1)
    .map((status) => preparationAtStatus(preparation, status));
}

function downgradeUnvalidatedSyncStatus(preparation: PreparationRecord): PreparationRecord {
  if (preparation.status === "user_submitted" || preparation.status === "authority_confirmed") {
    const { authorityConfirmation: _authorityConfirmation, ...withoutConfirmation } =
      preparation as PreparationRecord & { authorityConfirmation?: unknown };
    return { ...withoutConfirmation, status: "exported" } as PreparationRecord;
  }
  return preparation;
}

function preparationAtStatus(
  preparation: PreparationRecord,
  status: PreparationStatus,
): PreparationRecord {
  if (status === "authority_confirmed") {
    assertAuthorityConfirmation(preparation);
    return { ...preparation, status } as PreparationRecord;
  }

  const { authorityConfirmation: _authorityConfirmation, ...withoutConfirmation } =
    preparation as PreparationRecord & { authorityConfirmation?: unknown };
  return { ...withoutConfirmation, status } as PreparationRecord;
}

function stripSyncMetadata(
  { pendingSync: _pendingSync, syncedAt: _syncedAt, ...record }: StoredPreparation,
) {
  return record as PreparationRecord;
}

function serializePreparationSnapshot(
  preparation: PreparationRecord | StoredPreparation,
): string {
  return stableSerialize(stripSyncMetadata(preparation as StoredPreparation));
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
