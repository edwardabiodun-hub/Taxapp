import type { PreparationStatus } from "@/domain/tax-readiness";
import {
  createPreparationRecord,
  type PreparationRecord,
} from "@/domain/preparations";
import {
  isSubmissionEventValid,
  type SubmissionEvent,
} from "@/domain/submissions";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import {
  db,
  type LocalDeclaration,
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

    const record: StoredPreparation = {
      ...preparation,
      createdAt: existing?.createdAt ?? preparation.createdAt,
      updatedAt:
        existing && existing.updatedAt > preparation.updatedAt
          ? existing.updatedAt
          : preparation.updatedAt,
      pendingSync: true,
    };

    await db.preparations.put(record);
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
  if (!isSubmissionEventValid(event)) {
    throw new Error("Authority-confirmed events require an authority reference.");
  }

  const existing = await db.submissionEvents.get(event.id);
  if (existing) {
    throw new Error("Submission events are immutable and cannot be overwritten.");
  }

  await db.submissionEvents.add(event);
}

export async function migrateLegacyDeclarationsToPreparations(
  declarations: readonly LocalDeclaration[],
): Promise<void> {
  await db.transaction("rw", db.preparations, async () => {
    for (const declaration of declarations) {
      const migrated = migrateLegacyDeclaration(declaration);
      const existing = await db.preparations.get(migrated.id);

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
  const authorityConfirmation = getAuthorityConfirmation(record);
  const status: PreparationStatus = authorityConfirmation
    ? "authority_confirmed"
    : record.status === "draft"
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
      ...(authorityConfirmation ? { authorityConfirmation } : {}),
      formData: { ...record.formData, country: record.country },
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
    if (
      existing &&
      (existing.pendingSync || existing.updatedAt >= preparation.updatedAt)
    ) {
      return;
    }
    const lifecycle = getMigratedPreparationLifecycle(existing?.status, preparation);
    if (!lifecycle) {
      return;
    }
    assertAuthorityConfirmation(preparation);

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
): void {
  if (!isValidPreparationStatusTransition(existing?.status, preparation.status)) {
    throw new Error(
      `Invalid preparation status transition from ${existing?.status ?? "new"} to ${preparation.status}.`,
    );
  }
  assertAuthorityConfirmation(preparation);
}

function assertAuthorityConfirmation(preparation: PreparationRecord): void {
  if (
    preparation.status === "authority_confirmed" &&
    (!preparation.authorityConfirmation.authorityReference.trim() ||
      !preparation.authorityConfirmation.confirmedAt.trim())
  ) {
    throw new Error("Authority confirmation requires an authority reference.");
  }
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

function preparationAtStatus(
  preparation: PreparationRecord,
  status: PreparationStatus,
): PreparationRecord {
  if (status === "authority_confirmed") {
    assertAuthorityConfirmation(preparation);
    return { ...preparation, status };
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

function getAuthorityReference(record: LocalDeclaration): string | undefined {
  const reference =
    record.authorityReference ?? record.authorityConfirmation?.authorityReference;
  const trimmed = reference?.trim();
  return trimmed || undefined;
}

function getAuthorityConfirmedAt(record: LocalDeclaration): string | undefined {
  return (
    record.authorityConfirmedAt ?? record.authorityConfirmation?.confirmedAt
  )?.trim() || undefined;
}

function getAuthorityConfirmation(
  record: LocalDeclaration,
): { authorityReference: string; confirmedAt: string } | undefined {
  const authorityReference = getAuthorityReference(record);
  const confirmedAt = getAuthorityConfirmedAt(record);
  if (!authorityReference || !confirmedAt) return undefined;

  return { authorityReference, confirmedAt };
}
