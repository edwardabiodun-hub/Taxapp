import { calculateStateTax, type StateTaxBreakdown } from "./tax/state-tax";
import type { LocalDeclaration, LocalProfile } from "./local-db";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { TaxEstimateUnavailableError } from "@/lib/tax-calculator";

export interface FilingSummary {
  generatedAt: string;
  taxpayer: {
    name: string;
    taxId: string;
    country: string;
  };
  declaration: {
    taxYear: string;
    type: string;
    status: LocalDeclaration["status"];
    state?: string;
  };
  tax: StateTaxBreakdown | null;
  estimateWarnings: readonly string[];
  /** Where to actually take this summary — there is no direct government
   * API integration (NRS Rev360 / LIRS access is still unconfirmed), so
   * this is the filing path today, not a fallback for when one breaks. */
  guidance: string;
}

const GUIDANCE =
  "FileSmart does not yet have a direct filing integration with the Federal " +
  "Inland Revenue Service (FIRS) or your state's Internal Revenue Service " +
  "(SIRS). Review the preparation with the relevant authority or a qualified " +
  "adviser before filing; this summary is not proof of submission.";

/**
 * Builds the data for a filing summary a user can export and take to the
 * tax authority themselves. Recomputes the tax breakdown from the
 * declaration's stored form data at build time, rather than trusting a
 * cached amount, so the export always reflects the actual band/relief
 * logic currently in tax-calculator.ts for this declaration's inputs.
 */
export function buildFilingSummary(declaration: LocalDeclaration, profile: LocalProfile): FilingSummary {
  let tax: StateTaxBreakdown | null = null;
  let estimateWarnings: readonly string[] = [];
  try {
    tax = calculateStateTax(
      { ...declaration.formData, taxYear: declaration.taxYear, country: declaration.country } as NigeriaDeclarationForm,
      declaration.state ?? "",
    );
  } catch (error) {
    if (!(error instanceof TaxEstimateUnavailableError)) throw error;
    estimateWarnings = error.reasons;
  }

  return {
    generatedAt: new Date().toISOString(),
    taxpayer: {
      name: profile.name,
      taxId: profile.taxId,
      country: profile.country,
    },
    declaration: {
      taxYear: declaration.taxYear,
      type: declaration.type,
      status: declaration.status,
      state: declaration.state,
    },
    tax,
    estimateWarnings,
    guidance: GUIDANCE,
  };
}
