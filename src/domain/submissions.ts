export type SubmissionEventType =
  | "created"
  | "status_changed"
  | "exported"
  | "user_submitted"
  | "authority_confirmed"
  | "submission_failed"
  | "submission_rejected";

export type SubmissionActor = "user" | "system" | "authority";

export interface UserSubmissionEvidence {
  readonly source: string;
  readonly reference?: string;
  readonly submittedAt?: string;
  readonly note?: string;
}

interface SubmissionEventBase {
  readonly id: string;
  readonly preparationId: string;
  readonly actor: SubmissionActor;
  readonly timestamp: string;
  readonly authorityReference?: string;
  readonly userEvidence?: UserSubmissionEvidence;
}

export type SubmissionEvent =
  | (SubmissionEventBase & {
      readonly type: Exclude<SubmissionEventType, "authority_confirmed">;
    })
  | (SubmissionEventBase & {
      readonly type: "authority_confirmed";
      readonly actor: "authority";
      readonly authorityReference: string;
    });

export function isSubmissionEventValid(event: SubmissionEvent): boolean {
  if (event.userEvidence !== undefined && !isUserSubmissionEvidenceValid(event.userEvidence, event.timestamp)) {
    return false;
  }

  if (event.type !== "authority_confirmed") return true;

  return event.authorityReference.trim().length > 0;
}

export function isUserSubmissionEvidenceValid(
  evidence: unknown,
  referenceTimestamp?: string,
): evidence is UserSubmissionEvidence {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return false;
  }

  const value = evidence as Record<string, unknown>;
  const allowedKeys = new Set(["source", "reference", "submittedAt", "note"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;

  return isSafeEvidenceText(value.source) &&
    (value.reference === undefined || isSafeEvidenceText(value.reference)) &&
    (value.submittedAt === undefined || isValidTimestamp(value.submittedAt, referenceTimestamp)) &&
    (value.note === undefined || isSafeEvidenceText(value.note));
}

export function isValidTimestamp(value: unknown, referenceTimestamp?: string): value is string {
  if (!isSafeEvidenceText(value)) return false;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;

  if (referenceTimestamp !== undefined) {
    const reference = Date.parse(referenceTimestamp);
    if (!Number.isFinite(reference) || timestamp > reference) return false;
  }

  return true;
}

function isSafeEvidenceText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
}
