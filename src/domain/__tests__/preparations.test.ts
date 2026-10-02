import { describe, expect, it } from "vitest";
import { getCalculationLabel } from "@/domain/tax-readiness";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import type { SubmissionEvent } from "@/domain/submissions";

const genericCapability: JurisdictionCapability = {
  jurisdictionCode: "NG-LA",
  name: "Lagos",
  shortName: "Lagos",
  countryCode: "NG",
  ruleProfile: {
    kind: "generic_nigerian_pit",
    profileId: "ng-pit-baseline",
    version: "2026.1",
    source: "Nigerian PIT baseline",
    verifiedAt: "2026-10-02",
  },
  primaryReadiness: "Not yet supported",
  submissionModes: ["generic_export"],
  apiStatus: "not_pursued",
  deadlineProfile: { kind: "unverified", confidence: "low" },
  exportFormats: ["pdf", "csv", "xlsx"],
  notes: "Generic preparation and universal export are available.",
  registryVersion: "2026.1",
};

describe("preparation domain contracts", () => {
  it("uses the generic label unless a verified state rule profile exists", () => {
    expect(getCalculationLabel(genericCapability)).toBe("Generic Nigerian PIT estimate");

    const verifiedCapability: JurisdictionCapability = {
      ...genericCapability,
      ruleProfile: {
        kind: "verified_state",
        profileId: "ng-la-pit",
        version: "2026.1",
        source: "https://example.test/official-guidance",
        verifiedAt: "2026-10-02",
      },
    };

    expect(getCalculationLabel(verifiedCapability)).toBe("State-specific estimate");
  });

  it("defines preparation and immutable submission event fields", () => {
    const preparation = {
      id: "prep-1",
      jurisdictionCode: "NG-LA",
      taxYear: "2026",
      ruleProfileVersion: "2026.1",
      calculationLabel: "Generic Nigerian PIT estimate",
      filingReadiness: "Not yet supported",
      status: "draft",
      formData: {},
      confirmedReceiptIds: [],
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    } satisfies PreparationRecord;

    const event = {
      id: "event-1",
      preparationId: preparation.id,
      type: "created",
      actor: "user",
      timestamp: "2026-10-02T00:00:00.000Z",
    } as const satisfies SubmissionEvent;

    expect(preparation.status).toBe("draft");
    expect(event.type).toBe("created");
  });
});
