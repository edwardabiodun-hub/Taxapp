export interface PitTaxBand {
  readonly limit: number;
  readonly rate: number;
}

export interface PitRuleInputs {
  readonly taxBands: readonly PitTaxBand[];
  readonly minimumWageAnnual: number;
  readonly assumptions: readonly string[];
}

export interface PitBaseline {
  readonly profileId: "ng-pit-baseline";
  readonly status: "configured" | "unconfigured";
  readonly version: string;
  readonly effectiveTaxYears: readonly string[];
  readonly source: string;
  readonly verifiedAt: string;
  readonly confidence: EvidenceConfidence | null;
  readonly ruleInputs: PitRuleInputs;
}

export class PitBaselineConfigurationError extends Error {
  constructor(message = "Nigerian PIT baseline source and effective tax-year metadata are required.") {
    super(message);
    this.name = "PitBaselineConfigurationError";
  }
}

const ruleInputs: PitRuleInputs = Object.freeze({
  taxBands: Object.freeze([
    { limit: 800_000, rate: 0 },
    { limit: 2_200_000, rate: 0.15 },
    { limit: 9_000_000, rate: 0.18 },
    { limit: 13_000_000, rate: 0.21 },
    { limit: 25_000_000, rate: 0.23 },
    { limit: Infinity, rate: 0.25 },
  ].map((band) => Object.freeze(band))),
  minimumWageAnnual: 840_000,
  assumptions: Object.freeze([
    "2026 Nigeria Tax Act 2025 Fourth Schedule bands; no unverified state adjustment.",
    "Business and rental income entered are net amounts; listed expenses are not deducted again.",
    "Pension, NHF, NHIS, owner-occupied mortgage interest and qualifying insurance amounts require supporting evidence.",
    "Estimated income tax precedes PAYE and withholding tax credits and is not a government assessment.",
  ]),
});

/**
 * Source: Nigeria Tax Act 2025 (National Assembly gazette), ss. 28-32, 58,
 * 162 and Fourth Schedule. Reviewed for 2026 only; later years fail closed.
 */
const PIT_BASELINE: PitBaseline = Object.freeze({
  profileId: "ng-pit-baseline",
  status: "configured",
  version: "nta-2025-2026.1",
  effectiveTaxYears: Object.freeze(["2026"]),
  source: "https://nass.gov.ng/documents/download/11249",
  verifiedAt: "2026-10-16",
  confidence: "high",
  ruleInputs,
});

export function getPitRuleInputs(): PitRuleInputs {
  return PIT_BASELINE.ruleInputs;
}

export function isPitBaselineConfigured(baseline: PitBaseline): boolean {
  return (
    baseline.status === "configured" &&
    baseline.source.trim().length > 0 &&
    baseline.version.trim().length > 0 &&
    baseline.verifiedAt.trim().length > 0 &&
    baseline.confidence !== null &&
    baseline.effectiveTaxYears.length > 0 &&
    baseline.effectiveTaxYears.every((taxYear) => taxYear.trim().length > 0)
  );
}

export function getPitBaseline(): PitBaseline {
  if (!isPitBaselineConfigured(PIT_BASELINE)) {
    throw new PitBaselineConfigurationError();
  }

  return PIT_BASELINE;
}
import type { EvidenceConfidence } from "@/domain/jurisdictions";
