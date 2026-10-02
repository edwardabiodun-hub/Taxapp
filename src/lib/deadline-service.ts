import type {
  DeadlineConfidence,
  DeadlineSourceKind,
  ResolvedDeadline,
} from "@/domain/deadlines";
import type {
  DeadlineProfile,
  JurisdictionCapability,
} from "@/domain/jurisdictions";

const SOURCE_LABELS: Record<DeadlineSourceKind, string> = {
  verified_state: "State deadline",
  national_baseline:
    "National statutory baseline — confirm with your tax authority",
  unverified: "Deadline not verified",
};

const EXPLICIT_TIMEZONE = /(Z|[+-]\d{2}:\d{2})$/;

export function getDeadlineSourceLabel(sourceKind: DeadlineSourceKind): string {
  return SOURCE_LABELS[sourceKind];
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !EXPLICIT_TIMEZONE.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isConfidence(value: unknown): value is DeadlineConfidence {
  return value === "high" || value === "medium" || value === "low";
}

type DeadlineEvidence = {
  dueAt?: unknown;
  taxYear?: unknown;
  source?: unknown;
  verifiedAt?: unknown;
  effectiveFrom?: unknown;
  effectiveTo?: unknown;
  timezone?: unknown;
  recurrence?: unknown;
  confidence?: unknown;
};

type Candidate = {
  kind: Exclude<DeadlineSourceKind, "unverified">;
  evidence: DeadlineEvidence;
};

type CandidateResult = {
  candidate: Candidate;
  valid: boolean;
  stale: boolean;
  dueAt?: string;
};

function getEvidence(profile: DeadlineProfile | undefined): DeadlineEvidence | undefined {
  if (!profile || profile.kind === "unverified") return undefined;
  return profile.evidence as DeadlineEvidence;
}

function inspectCandidate(
  candidate: Candidate,
  taxYear: string,
  now: Date,
): CandidateResult {
  const evidence = candidate.evidence;
  const dueAt = isValidIsoTimestamp(evidence.dueAt)
    ? evidence.dueAt
    : undefined;
  const hasRequiredMetadata =
    dueAt !== undefined &&
    evidence.taxYear === taxYear &&
    typeof evidence.source === "string" &&
    evidence.source.trim().length > 0 &&
    isValidIsoTimestamp(evidence.verifiedAt) &&
    typeof evidence.timezone === "string" &&
    evidence.timezone.trim().length > 0 &&
    isConfidence(evidence.confidence) &&
    isValidIsoTimestamp(evidence.effectiveFrom) &&
    (evidence.effectiveTo === undefined ||
      isValidIsoTimestamp(evidence.effectiveTo));

  const effectiveFrom = isValidIsoTimestamp(evidence.effectiveFrom)
    ? Date.parse(evidence.effectiveFrom)
    : undefined;
  const effectiveTo = isValidIsoTimestamp(evidence.effectiveTo)
    ? Date.parse(evidence.effectiveTo)
    : undefined;
  const verifiedAt = isValidIsoTimestamp(evidence.verifiedAt)
    ? Date.parse(evidence.verifiedAt)
    : undefined;
  const stale =
    (effectiveFrom !== undefined && effectiveFrom > now.getTime()) ||
    (effectiveTo !== undefined && effectiveTo <= now.getTime()) ||
    (verifiedAt !== undefined && verifiedAt > now.getTime());

  return {
    candidate,
    valid: hasRequiredMetadata && !stale,
    stale: stale || !hasRequiredMetadata,
    dueAt,
  };
}

function asCandidate(profile: DeadlineProfile | undefined): Candidate | undefined {
  if (!profile || profile.kind === "unverified") return undefined;
  return { kind: profile.kind, evidence: getEvidence(profile) ?? {} };
}

function createUnverifiedDeadline(
  taxYear: string,
  staleResult?: CandidateResult,
): ResolvedDeadline {
  const evidence = staleResult?.candidate.evidence;
  const dueAt = staleResult?.dueAt;
  return {
    taxYear,
    sourceKind: "unverified",
    label: SOURCE_LABELS.unverified,
    ...(dueAt ? { dueAt } : {}),
    ...(typeof evidence?.source === "string" && evidence.source.trim()
      ? { source: evidence.source }
      : {}),
    ...(typeof evidence?.verifiedAt === "string"
      ? { verifiedAt: evidence.verifiedAt }
      : {}),
    ...(typeof evidence?.effectiveFrom === "string"
      ? { effectiveFrom: evidence.effectiveFrom }
      : {}),
    ...(typeof evidence?.effectiveTo === "string"
      ? { effectiveTo: evidence.effectiveTo }
      : {}),
    ...(typeof evidence?.timezone === "string"
      ? { timezone: evidence.timezone }
      : {}),
    ...(typeof evidence?.recurrence === "string"
      ? { recurrence: evidence.recurrence }
      : {}),
    confidence: isConfidence(evidence?.confidence) ? evidence.confidence : "low",
    isStale: staleResult?.stale ?? false,
    isAvailable: dueAt !== undefined,
  };
}

function createResolvedDeadline(
  result: CandidateResult,
  taxYear: string,
): ResolvedDeadline {
  const evidence = result.candidate.evidence;
  return {
    taxYear,
    sourceKind: result.candidate.kind,
    label: SOURCE_LABELS[result.candidate.kind],
    dueAt: result.dueAt,
    source: evidence.source as string,
    verifiedAt: evidence.verifiedAt as string,
    ...(typeof evidence.effectiveFrom === "string"
      ? { effectiveFrom: evidence.effectiveFrom }
      : {}),
    ...(typeof evidence.effectiveTo === "string"
      ? { effectiveTo: evidence.effectiveTo }
      : {}),
    timezone: evidence.timezone as string,
    ...(typeof evidence.recurrence === "string"
      ? { recurrence: evidence.recurrence }
      : {}),
    confidence: evidence.confidence as DeadlineConfidence,
    isStale: false,
    isAvailable: true,
  };
}

export function resolveDeadline(
  capability: JurisdictionCapability,
  taxYear: string,
  now: Date = new Date(),
): ResolvedDeadline {
  const stateCandidate =
    capability.deadlineProfile.kind === "verified_state"
      ? asCandidate(capability.deadlineProfile)
      : undefined;
  const nationalProfile =
    capability.deadlineProfile.kind === "national_baseline"
      ? capability.deadlineProfile
      : capability.nationalDeadlineProfile?.kind === "national_baseline"
        ? capability.nationalDeadlineProfile
        : undefined;
  const nationalCandidate = asCandidate(nationalProfile);

  const stateResult = stateCandidate
    ? inspectCandidate(stateCandidate, taxYear, now)
    : undefined;
  if (stateResult?.valid) return createResolvedDeadline(stateResult, taxYear);

  const nationalResult = nationalCandidate
    ? inspectCandidate(nationalCandidate, taxYear, now)
    : undefined;
  if (nationalResult?.valid) return createResolvedDeadline(nationalResult, taxYear);

  return createUnverifiedDeadline(
    taxYear,
    stateResult?.stale ? stateResult : nationalResult?.stale ? nationalResult : undefined,
  );
}
