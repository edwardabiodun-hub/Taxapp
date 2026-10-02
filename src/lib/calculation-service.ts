import {
  getPitBaseline,
  getPitRuleInputs,
  type PitBaseline,
} from "@/data/pit-baseline";
import type { PreparationFilingReadiness } from "@/domain/preparations";
import type { JurisdictionCapability, RuleProfile } from "@/domain/jurisdictions";
import {
  getCalculationLabel,
  type CalculationLabel,
} from "@/domain/tax-readiness";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import { calculateNigeriaTax, type TaxBreakdown } from "@/lib/tax-calculator";

export { getPitBaseline } from "@/data/pit-baseline";

export type PreparationCalculationInput = Partial<NigeriaDeclarationForm> & {
  readonly jurisdictionCode?: string;
};

export interface CalculationResult extends TaxBreakdown {
  readonly label: CalculationLabel;
  readonly filingReadiness: PreparationFilingReadiness;
  readonly ruleProfile: RuleProfile;
  readonly ruleProfileVersion: string;
  readonly source: string;
  readonly assumptions: readonly string[];
  readonly missingInputWarnings: readonly string[];
}

const CONFIGURATION_WARNING =
  "Approved official Nigerian PIT baseline source is not configured.";

function hasIncomeSource(form: NigeriaDeclarationForm): boolean {
  return [
    form.annualSalary,
    form.commissions,
    form.allowances,
    form.businessIncome,
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

function getBaselineOrUndefined(): PitBaseline | undefined {
  try {
    return getPitBaseline();
  } catch {
    return undefined;
  }
}

export function calculatePreparation(
  input: PreparationCalculationInput,
  capability: JurisdictionCapability,
): CalculationResult {
  const form = {
    ...defaultNigeriaForm,
    ...input,
    country: input.country ?? defaultNigeriaForm.country,
  } as NigeriaDeclarationForm;
  const jurisdictionCode = input.jurisdictionCode?.trim() ?? "";
  const baseline = getBaselineOrUndefined();
  const missingInputWarnings = getMissingInputWarnings(
    input,
    form,
    jurisdictionCode,
  );

  if (!baseline) {
    missingInputWarnings.unshift(CONFIGURATION_WARNING);
  }

  const label =
    missingInputWarnings.length > 0
      ? "Not filing-ready"
      : getCalculationLabel(capability, jurisdictionCode);
  const filingReadiness: PreparationFilingReadiness =
    label === "Not filing-ready" ? "Not filing-ready" : capability.primaryReadiness;
  const numericResult = calculateNigeriaTax(
    form,
    baseline?.ruleInputs ?? getPitRuleInputs(),
  );

  return {
    ...numericResult,
    label,
    filingReadiness,
    ruleProfile: capability.ruleProfile,
    ruleProfileVersion: baseline?.version ?? "",
    source: baseline?.source ?? "",
    assumptions: baseline?.ruleInputs.assumptions ?? getPitRuleInputs().assumptions,
    missingInputWarnings,
  };
}
