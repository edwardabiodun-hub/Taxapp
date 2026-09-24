import { calculateStateTax, type StateTaxBreakdown } from "./tax/state-tax";
import type { LocalDeclaration, LocalProfile } from "./local-db";
import type { NigeriaDeclarationForm } from "@/types/declaration";

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
  tax: StateTaxBreakdown;
  /** Where to actually take this summary — there is no direct government
   * API integration (NRS Rev360 / LIRS access is still unconfirmed), so
   * this is the filing path today, not a fallback for when one breaks. */
  guidance: string;
}

const GUIDANCE =
  "TaxEase does not yet have a direct filing integration with the Federal " +
  "Inland Revenue Service (FIRS) or your state's Internal Revenue Service " +
  "(SIRS). Use the figures in this summary to file directly through the " +
  "appropriate government portal, or take it to your local tax office. " +
  "This is an estimate only and is not a substitute for the official filing.";

/**
 * Builds the data for a filing summary a user can export and take to the
 * tax authority themselves. Recomputes the tax breakdown from the
 * declaration's stored form data at build time, rather than trusting a
 * cached amount, so the export always reflects the actual band/relief
 * logic currently in tax-calculator.ts for this declaration's inputs.
 */
export function buildFilingSummary(declaration: LocalDeclaration, profile: LocalProfile): FilingSummary {
  const tax = calculateStateTax(
    declaration.formData as unknown as NigeriaDeclarationForm,
    declaration.state ?? ""
  );

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
    guidance: GUIDANCE,
  };
}
