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

const statusOrder: readonly PreparationStatus[] = [
  "draft",
  "ready_for_review",
  "exported",
  "user_submitted",
  "authority_confirmed",
];

const statusIndex = (status: PreparationStatus) => statusOrder.indexOf(status);

export function isValidPreparationStatusTransition(
  from: PreparationStatus | undefined,
  to: PreparationStatus,
): boolean {
  if (from === undefined) return to !== "authority_confirmed";
  return to === from || statusIndex(to) >= statusIndex(from);
}

export async function savePreparation(preparation: PreparationRecord): Promise<void> {
  const existing = await db.preparations.get(preparation.id);
  if (!isValidPreparationStatusTransition(existing?.status, preparation.status)) {
    throw new Error(
      `Invalid preparation status transition from ${existing?.status ?? "new"} to ${preparation.status}.`,
    );
  }

  if (
    preparation.status === "authority_confirmed" &&
    (!preparation.authorityConfirmation.authorityReference.trim() ||
      !preparation.authorityConfirmation.confirmedAt.trim())
  ) {
    throw new Error("Authority confirmation requires an authority reference.");
  }

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

export function migrateLegacyDeclaration(record: LocalDeclaration): PreparationRecord {
  const authorityReference = getAuthorityReference(record);
  const confirmedAt = getAuthorityConfirmedAt(record) || record.updatedAt;
  const status: PreparationStatus = authorityReference
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
      ...(authorityReference
        ? {
            authorityConfirmation: {
              authorityReference,
              confirmedAt,
            },
          }
        : {}),
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

export async function markPreparationSynced(id: string, syncedAt = new Date().toISOString()) {
  await db.preparations.update(id, { pendingSync: false, syncedAt });
}

export async function savePreparationFromSync(
  preparation: PreparationRecord,
  syncedAt = new Date().toISOString(),
): Promise<void> {
  const existing = await db.preparations.get(preparation.id);
  if (
    existing?.status === "authority_confirmed" &&
    preparation.status !== "authority_confirmed"
  ) {
    return;
  }
  if (!isValidPreparationStatusTransition(existing?.status, preparation.status)) {
    return;
  }

  await db.preparations.put({
    ...preparation,
    createdAt: existing?.createdAt ?? preparation.createdAt,
    updatedAt:
      existing && existing.updatedAt > preparation.updatedAt
        ? existing.updatedAt
        : preparation.updatedAt,
    pendingSync: false,
    syncedAt,
  });
}

function stripSyncMetadata({ pendingSync: _pendingSync, syncedAt: _syncedAt, ...record }: StoredPreparation) {
  return record as PreparationRecord;
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
