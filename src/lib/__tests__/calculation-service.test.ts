import { describe, expect, it } from "vitest";
import {
  getPitRuleInputs,
  type PitBaseline,
} from "@/data/pit-baseline";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
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

const configuredBaseline: PitBaseline = {
  profileId: "ng-pit-baseline",
  status: "configured",
  version: "test-2026.1",
  effectiveTaxYears: ["2026"],
  source: "test-approved-source",
  verifiedAt: "2026-10-02",
  confidence: "high",
  ruleInputs: getPitRuleInputs(),
};

const verifiedStateCapability: JurisdictionCapability = {
  ...notSupportedCapability,
  ruleProfile: {
    kind: "verified_state",
    profileId: "ng-la-pit",
    version: "state-2026.1",
    evidence: {
      source: "test-state-source",
      effectiveFrom: "2026-01-01",
      effectiveTo: "2026-12-31",
      verifiedAt: "2026-10-02",
      confidence: "high",
    },
  },
};

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

  it("uses the applied verified-state profile for calculation provenance", () => {
    const result = calculatePreparation(
      minimumInput,
      verifiedStateCapability,
      configuredBaseline,
    );

    expect(result.label).toBe("State-specific estimate");
    expect(result.ruleProfileVersion).toBe("state-2026.1");
    expect(result.source).toBe("test-state-source");
    expect(result.effectiveFrom).toBe("2026-01-01");
    expect(result.effectiveTo).toBe("2026-12-31");
    expect(result.verifiedAt).toBe("2026-10-02");
    expect(result.confidence).toBe("high");
    expect(result.provenance?.source).toBe("test-state-source");
  });

  it("fails closed when the configured baseline does not cover the requested tax year", () => {
    const result = calculatePreparation(
      minimumInput,
      notSupportedCapability,
      { ...configuredBaseline, effectiveTaxYears: ["2025"] },
    );

    expect(result.label).toBe("Not filing-ready");
    expect(result.missingInputWarnings).toContain(
      "Approved Nigerian PIT baseline does not cover tax year 2026.",
    );
  });
});
