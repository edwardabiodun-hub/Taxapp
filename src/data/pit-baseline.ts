export interface PitTaxBand {
  readonly limit: number;
  readonly rate: number;
}

export interface PitRuleInputs {
  readonly taxBands: readonly PitTaxBand[];
  readonly minimumTaxRate: number;
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
    { limit: 300_000, rate: 0.07 },
    { limit: 300_000, rate: 0.11 },
    { limit: 500_000, rate: 0.15 },
    { limit: 500_000, rate: 0.19 },
    { limit: 1_600_000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ].map((band) => Object.freeze(band))),
  minimumTaxRate: 0.01,
  assumptions: Object.freeze([
    "The existing Nigerian PIT calculator formula is used without state-specific adjustments.",
    "Dividends and interest are excluded from taxable investment income under the existing calculator behavior.",
    "A company vehicle benefit is calculated at 10% of company vehicle cost.",
    "Consolidated Relief Allowance uses the higher of ₦200,000 or 1% of gross income, plus 20% of gross income.",
    "Minimum tax is 1% of gross income when it exceeds graduated tax.",
  ]),
});

/**
 * The numeric rule inputs are retained for compatibility with the existing
 * calculator. The official source and effective tax-year metadata are
 * intentionally unconfigured until an approved source is added to the repo.
 */
const PIT_BASELINE: PitBaseline = Object.freeze({
  profileId: "ng-pit-baseline",
  status: "unconfigured",
  version: "",
  effectiveTaxYears: Object.freeze([]),
  source: "",
  verifiedAt: "",
  confidence: null,
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
