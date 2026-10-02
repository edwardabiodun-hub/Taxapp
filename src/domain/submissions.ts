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
  if (!isValidTimestamp(event.timestamp)) return false;

  if (event.userEvidence !== undefined && !isUserSubmissionEvidenceValid(event.userEvidence, event.timestamp)) {
    return false;
  }

  if (event.type !== "authority_confirmed") return true;

  return isSafeEvidenceText(event.authorityReference);
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

  // Persisted lifecycle timestamps must be unambiguous ISO instants, not
  // locale-dependent or date-only strings.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , zone, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] ||
    hour > 23 || minute > 59 || second > 59 ||
    offsetHour > 23 || offsetMinute > 59 || (zone !== "Z" && zone[0] !== "+" && zone[0] !== "-")
  ) {
    return false;
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;

  const reference = referenceTimestamp === undefined
    ? Date.now()
    : Date.parse(referenceTimestamp);
  if (!Number.isFinite(reference) || timestamp > reference) return false;

  return true;
}

function isSafeEvidenceText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
}
