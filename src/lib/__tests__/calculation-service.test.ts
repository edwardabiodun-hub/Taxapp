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
  it("uses the reviewed 2026 statutory baseline without claiming filing readiness", () => {
    const result = calculatePreparation(minimumInput, notSupportedCapability);

    expect(result.label).toBe("Generic Nigerian PIT estimate");
    expect(result.ruleProfile.kind).toBe("generic_nigerian_pit");
    expect(result.ruleProfileVersion).toBe("nta-2025-2026.1");
    expect(result.source).toContain("nass.gov.ng");
    expect(result.tax?.finalTax).toBe(30_000);
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

    expect(result.tax?.finalTax).toBe(30_000);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.ruleProfile.profileId).toBe("ng-pit-baseline");
  });

  it("returns verified baseline metadata", () => {
    expect(getPitBaseline().source).toContain("nass.gov.ng");
  });

  it("does not claim a state-specific formula merely because a state profile has evidence", () => {
    const result = calculatePreparation(
      minimumInput,
      verifiedStateCapability,
      configuredBaseline,
    );

    expect(result.label).toBe("Generic Nigerian PIT estimate");
    expect(result.ruleProfileVersion).toBe("test-2026.1");
    expect(result.source).toBe("test-approved-source");
    expect(result.effectiveFrom).toBe("2026-01-01");
    expect(result.effectiveTo).toBeUndefined();
    expect(result.verifiedAt).toBe("2026-10-02");
    expect(result.confidence).toBe("high");
    expect(result.provenance?.source).toBe("test-approved-source");
  });

  it("fails closed when the configured baseline does not cover the requested tax year", () => {
    const result = calculatePreparation(
      minimumInput,
      notSupportedCapability,
      { ...configuredBaseline, effectiveTaxYears: ["2025"] },
    );

    expect(result.label).toBe("Not filing-ready");
    expect(result.tax).toBeNull();
    expect(result.missingInputWarnings).toContain(
      "Approved Nigerian PIT baseline does not cover tax year 2026.",
    );
  });

  it("withholds numbers for unsupported facts while preserving a savable preparation", () => {
    const result = calculatePreparation({ ...minimumInput, companyVehicleCost: "1000000" }, notSupportedCapability);
    expect(result.tax).toBeNull();
    expect(result.missingInputWarnings.join(" ")).toContain("vehicle");
    expect(result.ruleProfileVersion).toBe("nta-2025-2026.1");
  });

  it("explains dividend-only preparations instead of claiming no income was entered", () => {
    const result = calculatePreparation({ taxYear: "2026", jurisdictionCode: "NG-LA", nigerianDividends: "100000" }, notSupportedCapability);
    expect(result.tax).toBeNull();
    expect(result.missingInputWarnings.join(" ")).toContain("Dividend treatment");
  });

  it("never applies the 2026 schedule to historical drafts", () => {
    const result = calculatePreparation({ ...minimumInput, taxYear: "2025" }, notSupportedCapability);
    expect(result.tax).toBeNull();
    expect(result.label).toBe("Not filing-ready");
  });
});
