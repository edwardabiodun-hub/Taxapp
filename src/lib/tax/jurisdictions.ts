import type { TaxBreakdown } from "@/lib/tax-calculator";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface StateJurisdiction {
  code: string; // "lagos"
  overrides?: {
    /** Additional state-level levies, each citing its legal basis the same
     * way tax-calculator.ts's TAX_BANDS cites PITA. Summed into finalTax by
     * state-tax.ts's calculateStateTax(). */
    levies?: (federal: TaxBreakdown, form: NigeriaDeclarationForm) => { label: string; amount: number }[];
    /** Replaces the federal finalTax entirely for this state, if its SIRS is
     * ever confirmed to compute final liability by a genuinely different
     * formula rather than an additive levy. Applied before levies. */
    finalTaxOverride?: (federal: TaxBreakdown, form: NigeriaDeclarationForm) => number;
  };
}

// A state with no confirmed exceptions is a one-line entry -- pure federal
// baseline. Do not add empty `{ overrides: {} }` objects; omit `overrides`
// entirely so it's obvious at a glance which states have a real, cited
// exception and which don't.
export const JURISDICTIONS: Record<string, StateJurisdiction> = {
  lagos: { code: "lagos" },
  ogun: { code: "ogun" },
  oyo: { code: "oyo" },
  osun: { code: "osun" },
};
