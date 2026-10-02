import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import {
  calculatePreparation,
  getPitBaseline,
  type PreparationCalculationInput,
} from "@/lib/calculation-service";

const minimumInput: PreparationCalculationInput = {
  taxYear: "2026",
  jurisdictionCode: "NG-LA",
  annualSalary: "1000000",
};

const notSupportedCapability = getJurisdictionCapability("NG-LA");

describe("calculation service", () => {
  it("fails closed when the approved PIT baseline source is not configured", () => {
    const result = calculatePreparation(minimumInput, notSupportedCapability);

    expect(result.label).toBe("Not filing-ready");
    expect(result.ruleProfile.kind).toBe("generic_nigerian_pit");
    expect(result.ruleProfileVersion).toBe("");
    expect(result.source).toBe("");
    expect(result.missingInputWarnings).toContain(
      "Approved official Nigerian PIT baseline source is not configured.",
    );
  });

  it("does not claim state-specific rules without verified evidence", () => {
    const capability = {
      ...notSupportedCapability,
      ruleProfile: {
        kind: "generic_nigerian_pit" as const,
        profileId: "ng-pit-baseline" as const,
        version: "2026.1",
        baseline: {
          source: "official-source",
          effectiveFrom: "2026-01-01",
          reviewedAt: "2026-10-02",
        },
      },
    };

    expect(calculatePreparation(minimumInput, capability).label).not.toBe(
      "State-specific estimate",
    );
  });

  it("delegates numeric calculation while returning provenance warnings", () => {
    const result = calculatePreparation(minimumInput, notSupportedCapability);

    expect(result.finalTax).toBe(54_000);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.ruleProfile.profileId).toBe("ng-pit-baseline");
  });

  it("rejects an unconfigured baseline instead of returning fabricated metadata", () => {
    expect(() => getPitBaseline()).toThrow(
      "Nigerian PIT baseline source and effective tax-year metadata are required.",
    );
  });
});
