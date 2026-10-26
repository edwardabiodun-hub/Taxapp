import {
  getPitBaseline,
  isPitBaselineConfigured,
  PitBaselineConfigurationError,
  type PitBaseline,
} from "@/data/pit-baseline";
import type {
  CalculationProvenance,
  PreparationFilingReadiness,
} from "@/domain/preparations";
import type {
  EvidenceConfidence,
  JurisdictionCapability,
  RuleProfile,
} from "@/domain/jurisdictions";
import type { CalculationLabel } from "@/domain/tax-readiness";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import { calculateNigeriaTax, TaxEstimateUnavailableError, type TaxBreakdown } from "@/lib/tax-calculator";

export { getPitBaseline } from "@/data/pit-baseline";

export type PreparationCalculationInput = Partial<NigeriaDeclarationForm> & {
  readonly jurisdictionCode?: string;
};

export interface CalculationResult {
  readonly tax: TaxBreakdown | null;
  readonly label: CalculationLabel;
  readonly filingReadiness: PreparationFilingReadiness;
  readonly ruleProfile: RuleProfile;
  readonly ruleProfileVersion: string;
  readonly source: string;
  readonly effectiveTaxYears: readonly string[];
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly verifiedAt: string;
  readonly confidence: EvidenceConfidence | null;
  readonly assumptions: readonly string[];
  readonly missingInputWarnings: readonly string[];
  readonly provenance: CalculationProvenance;
}

const CONFIGURATION_WARNING =
  "Approved official Nigerian PIT baseline source is not configured.";

function hasIncomeSource(form: NigeriaDeclarationForm): boolean {
  return [
    form.annualSalary,
    form.commissions,
    form.bonuses,
    form.allowances,
    form.businessIncome,
    form.rentIncome,
    form.nigerianDividends,
    form.otherDividends,
    form.interestIncome,
    form.otherInvestmentIncome,
    form.rentPaidByEmployer,
    form.domesticStaffByEmployer,
    form.companyVehicleCost,
    form.pensionReceived,
    form.annuityInsurance,
    form.gratuities,
    form.foreignIncome,
  ].some((value) => value.trim().length > 0);
}

function getMissingInputWarnings(
  input: PreparationCalculationInput,
  form: NigeriaDeclarationForm,
  jurisdictionCode: string,
): string[] {
  const warnings: string[] = [];

  if (!input.taxYear?.trim()) {
    warnings.push("Tax year is required.");
  }
  if (!jurisdictionCode) {
    warnings.push("Jurisdiction selection is required.");
  }
  if (!hasIncomeSource(form)) {
    warnings.push("At least one income source is required.");
  }

  return warnings;
}

function getBaselineOrUndefined(
  taxYear: string,
  baselineOverride?: PitBaseline,
): { baseline?: PitBaseline; warning?: string } {
  if (baselineOverride) {
    if (!isPitBaselineConfigured(baselineOverride)) {
      return { warning: CONFIGURATION_WARNING };
    }
    if (!baselineOverride.effectiveTaxYears.includes(taxYear)) {
      return {
        warning: `Approved Nigerian PIT baseline does not cover tax year ${taxYear}.`,
      };
    }
    return { baseline: baselineOverride };
  }

  try {
    const baseline = getPitBaseline();
    if (!baseline.effectiveTaxYears.includes(taxYear)) {
      return {
        warning: `Approved Nigerian PIT baseline does not cover tax year ${taxYear}.`,
      };
    }
    return { baseline };
  } catch (error) {
    if (error instanceof PitBaselineConfigurationError) {
      return { warning: CONFIGURATION_WARNING };
    }
    throw error;
  }
}

const unconfiguredRuleProfile = (): RuleProfile => ({
  kind: "generic_nigerian_pit",
  profileId: "ng-pit-baseline",
  version: "",
  baseline: {
    status: "unconfigured",
    source: "",
    effectiveFrom: "",
    reviewedAt: "",
  },
});

function getAppliedProfileMetadata(
  baseline: PitBaseline | undefined,
  taxYear: string,
): {
  ruleProfile: RuleProfile;
  ruleProfileVersion: string;
  source: string;
  effectiveTaxYears: readonly string[];
  effectiveFrom: string;
  effectiveTo?: string;
  verifiedAt: string;
  confidence: EvidenceConfidence | null;
} {
  if (!baseline) {
    return {
      ruleProfile: unconfiguredRuleProfile(),
      ruleProfileVersion: "",
      source: "",
      effectiveTaxYears: [],
      effectiveFrom: "",
      verifiedAt: "",
      confidence: null,
    };
  }

  return {
    ruleProfile: {
      kind: "generic_nigerian_pit",
      profileId: baseline.profileId,
      version: baseline.version,
      baseline: {
        status: "configured",
        source: baseline.source,
        effectiveFrom: `${taxYear}-01-01`,
        reviewedAt: baseline.verifiedAt,
      },
    },
    ruleProfileVersion: baseline.version,
    source: baseline.source,
    effectiveTaxYears: baseline.effectiveTaxYears,
    effectiveFrom: `${taxYear}-01-01`,
    verifiedAt: baseline.verifiedAt,
    confidence: baseline.confidence,
  };
}

export function calculatePreparation(
  input: PreparationCalculationInput,
  capability: JurisdictionCapability,
  baselineOverride?: PitBaseline,
): CalculationResult {
  const form = {
    ...defaultNigeriaForm,
    ...input,
    country: input.country ?? defaultNigeriaForm.country,
  } as NigeriaDeclarationForm;
  const jurisdictionCode = input.jurisdictionCode?.trim() ?? "";
  const baselineResolution = getBaselineOrUndefined(
    input.taxYear?.trim() ?? "",
    baselineOverride,
  );
  const baseline = baselineResolution.baseline;
  const missingInputWarnings = getMissingInputWarnings(
    input,
    form,
    jurisdictionCode,
  );

  if (baselineResolution.warning) {
    missingInputWarnings.unshift(baselineResolution.warning);
  }

  let numericResult: TaxBreakdown | null = null;
  if (baseline && missingInputWarnings.length === 0) {
    try {
      numericResult = calculateNigeriaTax(form, baseline.ruleInputs);
    } catch (error) {
      if (!(error instanceof TaxEstimateUnavailableError)) throw error;
      missingInputWarnings.push(...error.reasons);
    }
  }
  const label = numericResult
    ? "Generic Nigerian PIT estimate"
    : "Not filing-ready";
  const appliedProfile = getAppliedProfileMetadata(
    baseline,
    input.taxYear?.trim() ?? "",
  );
  const filingReadiness: PreparationFilingReadiness =
    label === "Not filing-ready" ? "Not filing-ready" : capability.primaryReadiness;
  return {
    tax: numericResult,
    label,
    filingReadiness,
    ruleProfile: appliedProfile.ruleProfile,
    ruleProfileVersion: appliedProfile.ruleProfileVersion,
    source: appliedProfile.source,
    effectiveTaxYears: appliedProfile.effectiveTaxYears,
    effectiveFrom: appliedProfile.effectiveFrom,
    effectiveTo: appliedProfile.effectiveTo,
    verifiedAt: appliedProfile.verifiedAt,
    confidence: appliedProfile.confidence,
    assumptions: baseline?.ruleInputs.assumptions ?? [],
    missingInputWarnings,
    provenance: {
      label,
      ruleProfileId: appliedProfile.ruleProfile.profileId,
      ruleProfileVersion: appliedProfile.ruleProfileVersion,
      source: appliedProfile.source,
      effectiveTaxYears: appliedProfile.effectiveTaxYears,
      effectiveFrom: appliedProfile.effectiveFrom,
      effectiveTo: appliedProfile.effectiveTo,
      verifiedAt: appliedProfile.verifiedAt,
      confidence: appliedProfile.confidence,
      assumptions: baseline?.ruleInputs.assumptions ?? [],
      missingInputWarnings,
    },
  };
}
