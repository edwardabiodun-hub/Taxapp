import { listNigeriaJurisdictions } from "@/data/jurisdiction-registry";

export type FilingDirectoryStatus = "verified" | "not_verified";

export interface FilingDirectoryEvidence {
  readonly sourceUrl: string;
  readonly checkedAt: string;
  readonly reviewer: string;
  readonly evidenceTitle: string;
  readonly servicePeriod: string;
  readonly confidence: "high" | "medium" | "low";
  readonly limitations: string;
}

/**
 * A deliberately conservative public directory contract. A state may only be
 * marked verified after an authority source and the specific individual-PIT
 * workflow have been independently checked.
 */
interface FilingDirectoryEntryBase {
  readonly jurisdictionCode: string;
  readonly name: string;
  readonly shortName: string;
}

export type FilingDirectoryEntry = FilingDirectoryEntryBase & (
  | {
      readonly onlineTaxSubmission: "not_verified";
      readonly individualPitSubmission: "not_verified";
      readonly portalUrl?: never;
      readonly sourceUrl?: never;
      readonly checkedAt?: never;
      readonly evidence?: never;
    }
  | {
      readonly onlineTaxSubmission: FilingDirectoryStatus;
      readonly individualPitSubmission: FilingDirectoryStatus;
      readonly portalUrl?: string;
      readonly sourceUrl: string;
      readonly checkedAt: string;
      readonly evidence: FilingDirectoryEvidence;
    }
);

const unverifiedEntry = (jurisdictionCode: string, name: string, shortName: string): FilingDirectoryEntry => ({
  jurisdictionCode,
  name,
  shortName,
  onlineTaxSubmission: "not_verified",
  individualPitSubmission: "not_verified",
});

/**
 * Returns directory rows for all supported jurisdictions without implying
 * that a generic export route is an authority portal integration.
 */
export function listFilingDirectoryEntries(): readonly FilingDirectoryEntry[] {
  return listNigeriaJurisdictions().map(({ jurisdictionCode, name, shortName }) =>
    unverifiedEntry(jurisdictionCode, name, shortName),
  );
}

export function getFilingDirectoryEntry(code: string): FilingDirectoryEntry | undefined {
  const normalizedCode = code.trim().toUpperCase();
  return listFilingDirectoryEntries().find(({ jurisdictionCode }) => jurisdictionCode === normalizedCode);
}

type FilingDirectoryCandidate = FilingDirectoryEntryBase & {
  readonly onlineTaxSubmission: FilingDirectoryStatus;
  readonly individualPitSubmission: FilingDirectoryStatus;
  readonly sourceUrl?: string;
  readonly checkedAt?: string;
  readonly evidence?: FilingDirectoryEvidence;
};

/**
 * Prevents a future verified status from being published without a matching,
 * dated official authority source and reviewer record.
 */
export function hasPublishableEvidence(entry: FilingDirectoryCandidate): boolean {
  const hasVerifiedClaim =
    entry.onlineTaxSubmission === "verified" || entry.individualPitSubmission === "verified";
  if (!hasVerifiedClaim || !entry.sourceUrl || !entry.checkedAt || !entry.evidence) return false;

  let source: URL;
  try {
    source = new URL(entry.sourceUrl);
  } catch {
    return false;
  }

  const hasOfficialSource = source.protocol === "https:" && source.hostname.endsWith(".gov.ng");
  const hasValidDate = /^\d{4}-\d{2}-\d{2}$/.test(entry.checkedAt) && !Number.isNaN(Date.parse(entry.checkedAt));
  const evidence = entry.evidence;

  return (
    hasOfficialSource &&
    hasValidDate &&
    evidence.sourceUrl === entry.sourceUrl &&
    evidence.checkedAt === entry.checkedAt &&
    [evidence.reviewer, evidence.evidenceTitle, evidence.servicePeriod, evidence.limitations].every((value) => value.trim().length > 0) &&
    ["high", "medium", "low"].includes(evidence.confidence)
  );
}
