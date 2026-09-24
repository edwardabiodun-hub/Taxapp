import { calculateNigeriaTax, type TaxBreakdown } from "@/lib/tax-calculator";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { JURISDICTIONS, type StateJurisdiction } from "./jurisdictions";

export interface StateTaxBreakdown extends TaxBreakdown {
  stateLevies: { label: string; amount: number }[];
}

/** Rounds to 2 decimal places (kobo precision), same convention as
 * tax-calculator.ts's own round2 -- duplicated here as a 2-line generic
 * math utility, not tax logic, so it isn't the kind of drift-risk
 * duplication the spec's Approach B rejection was about. */
function roundToKobo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateStateTax(
  form: NigeriaDeclarationForm,
  stateCode: string,
  jurisdictions: Record<string, StateJurisdiction> = JURISDICTIONS
): StateTaxBreakdown {
  const federal = calculateNigeriaTax(form);
  const jurisdiction = jurisdictions[stateCode];

  if (!jurisdiction?.overrides) {
    return { ...federal, stateLevies: [] };
  }

  const baseFinalTax = jurisdiction.overrides.finalTaxOverride
    ? jurisdiction.overrides.finalTaxOverride(federal, form)
    : federal.finalTax;

  const stateLevies = jurisdiction.overrides.levies?.(federal, form) ?? [];
  const leviesTotal = stateLevies.reduce((sum, levy) => sum + levy.amount, 0);

  return {
    ...federal,
    finalTax: roundToKobo(baseFinalTax + leviesTotal),
    stateLevies,
  };
}
