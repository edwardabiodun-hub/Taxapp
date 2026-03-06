import type { NigeriaDeclarationForm } from "@/types/declaration";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStep(step: number, form: NigeriaDeclarationForm): ValidationResult {
  const errors: string[] = [];

  switch (step) {
    case 0: // Country
      if (!form.taxYear) errors.push("Tax Year is required");
      if (!form.country) errors.push("Country is required");
      break;

    case 1: // Earned Income — at least one income source required
      {
        const hasEmployment = form.annualSalary.trim() || form.commissions.trim() || form.allowances.trim();
        const hasBusiness = form.businessIncome.trim();
        const hasAnnuity = form.pensionReceived.trim() || form.annuityInsurance.trim() || form.gratuities.trim();
        const hasForeign = form.foreignIncome.trim();
        if (!hasEmployment && !hasBusiness && !hasAnnuity && !hasForeign) {
          errors.push("At least one income source is required");
        }
      }
      break;

    case 2: // Investment Income — optional, no required fields
      break;

    case 3: // Benefits in Kind — optional, no required fields
      break;

    case 4: // Deductions — optional, no required fields
      break;

    case 5: // Documents — optional
      break;

    case 6: // Review — no validation needed
      break;
  }

  return { valid: errors.length === 0, errors };
}

export function isValidAmount(value: string): boolean {
  if (!value.trim()) return true; // empty is ok (optional)
  const cleaned = value.replace(/,/g, "");
  return /^\d+(\.\d{1,2})?$/.test(cleaned) && parseFloat(cleaned) >= 0;
}
