import { describe, expect, it } from "vitest";
import { getFilingDirectoryEntry, hasPublishableEvidence, listFilingDirectoryEntries } from "./filing-directory";

describe("filing directory contract", () => {
  it("covers every jurisdiction without inferring portal or individual-PIT support", () => {
    const entries = listFilingDirectoryEntries();

    expect(entries).toHaveLength(37);
    expect(entries.every((entry) => entry.onlineTaxSubmission === "not_verified")).toBe(true);
    expect(entries.every((entry) => entry.individualPitSubmission === "not_verified")).toBe(true);
    expect(entries.every((entry) => entry.portalUrl === undefined && entry.sourceUrl === undefined)).toBe(true);
  });

  it("normalizes jurisdiction lookups", () => {
    expect(getFilingDirectoryEntry("ng-la")).toMatchObject({
      jurisdictionCode: "NG-LA",
      name: "Lagos",
      individualPitSubmission: "not_verified",
    });
    expect(getFilingDirectoryEntry("NG-NOT-A-STATE")).toBeUndefined();
  });

  it("does not permit a verified filing claim without official evidence", () => {
    const candidate = {
      ...listFilingDirectoryEntries()[0],
      onlineTaxSubmission: "verified",
    } as const;

    expect(hasPublishableEvidence(candidate)).toBe(false);
    expect(hasPublishableEvidence({
      ...candidate,
      sourceUrl: "https://irs.example.com/filing",
      checkedAt: "2026-10-27",
      evidence: {
        sourceUrl: "https://irs.example.com/filing",
        checkedAt: "2026-10-27",
        reviewer: "Reviewer",
        evidenceTitle: "Online filing service",
        servicePeriod: "2026",
        confidence: "high",
        limitations: "Individual PIT filing remains unverified.",
      },
    })).toBe(false);
  });

  it("accepts a verified claim only with an official HTTPS .gov.ng source", () => {
    const candidate = {
      ...listFilingDirectoryEntries()[0],
      onlineTaxSubmission: "verified",
      sourceUrl: "https://irs.ogun.gov.ng/filing",
      checkedAt: "2026-10-27",
      evidence: {
        sourceUrl: "https://irs.ogun.gov.ng/filing",
        checkedAt: "2026-10-27",
        reviewer: "Reviewer",
        evidenceTitle: "Online filing service",
        servicePeriod: "2026",
        confidence: "high",
        limitations: "Individual PIT filing remains unverified.",
      },
    } as const;

    expect(hasPublishableEvidence(candidate)).toBe(true);
  });
});
