import { getPitBaseline, type PitRuleInputs } from "@/data/pit-baseline";
import { calculateRentRelief } from "@/lib/rent-relief";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface TaxBreakdown {
  grossIncome: number;
  /** Total income declared, including investment income disclosed but not taxed again where final withholding tax applies. */
  reportedIncome: number;
  /** Income disclosed for review but not included in the automated PIT base until its legal treatment is classified. */
  disclosedUnclassifiedIncome: number;
  /** Investment income disclosed for the return but excluded from the automated PIT base. */
  excludedInvestmentIncome: number;
  /** Itemized business and trade expenses deducted from gross business income. */
  businessExpenses: number;
  totalDeductions: number;
  taxableIncome: number;
  bands: { range: string; income: number; rate: number; tax: number }[];
  computedTax: number;
  payeCredit: number;
  estimatedBalanceAfterCredits: number;
  finalTax: number;
  effectiveRate: number;
  warnings: readonly string[];
}

export class TaxEstimateUnavailableError extends Error {
  readonly reasons: readonly string[];
  constructor(reasons: string[]) {
    super(reasons.join(" "));
    this.name = "TaxEstimateUnavailableError";
    this.reasons = reasons;
  }
}

const moneyFields = [
  "annualSalary", "commissions", "bonuses", "allowances", "businessIncome", "businessExpenses",
  "businessLoanInterest", "businessPremisesRent", "businessRepairsMaintenance",
  "businessEmployeeRemuneration", "businessBadDebts", "businessProfessionalFees",
  "pensionReceived", "annuityInsurance", "gratuities", "foreignIncome", "digitalAssetGains",
  "digitalAssetCharges", "chargeableGains", "nigerianDividends",
  "otherDividends", "interestIncome", "rentIncome", "rentExpenses", "otherInvestmentIncome",
  "rentPaidBySelf", "rentPaidByEmployer", "domesticStaffBySelf", "domesticStaffByEmployer",
  "companyVehicleCost", "employeePension", "annualRentPaid", "nationalHousingFund",
  "nationalHealthInsurance", "mortgageInterest", "lifeInsurancePremium", "payeAlreadySuffered",
] as const;

const reviewWarnings: readonly [keyof NigeriaDeclarationForm, string][] = [
  ["pensionReceived", "Pension treatment is disclosed but needs professional classification before filing."],
  ["annuityInsurance", "Annuity income is disclosed but needs professional classification before filing."],
  ["gratuities", "Gratuities are disclosed but need professional classification before filing."],
  ["foreignIncome", "Foreign income is included; confirm residency, source, treaty relief and any foreign-tax credit separately."],
  ["otherInvestmentIncome", "Other investment income is disclosed; confirm whether final withholding tax applies and retain the supporting certificate."],
  ["rentPaidByEmployer", "Employer-provided housing is disclosed; confirm the benefit valuation separately."],
  ["domesticStaffByEmployer", "Employer-provided domestic staff are disclosed; confirm the benefit valuation separately."],
  ["companyVehicleCost", "A company vehicle benefit is disclosed; confirm its statutory valuation separately."],
  ["chargeableGains", "Chargeable gains are disclosed but are not included in this PIT estimate until a reviewed gains module is available."],
];

function readAmount(value: string | undefined, label: string, reasons: string[]): number {
  const raw = (value ?? "").trim();
  if (!raw) return 0;
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw)) {
    reasons.push(`${label} must be a non-negative amount with at most two decimal places.`);
    return 0;
  }
  const amount = Number(raw.replace(/,/g, ""));
  if (!Number.isSafeInteger(Math.round(amount * 100))) {
    reasons.push(`${label} is too large to estimate safely.`);
    return 0;
  }
  return amount;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validateReviewFacts(
  form: NigeriaDeclarationForm,
  amounts: Record<(typeof moneyFields)[number], number>,
  reasons: string[],
  warnings: string[],
): void {
  const taxYear = form.taxYear.trim();
  const rentContext = [form.rentPeriodStart, form.rentPeriodEnd, form.rentSharedWithOthers]
    .some((value) => Boolean(value?.trim()));
  if (rentContext) {
    const start = form.rentPeriodStart?.trim() ?? "";
    const end = form.rentPeriodEnd?.trim() ?? "";
    if (amounts.annualRentPaid <= 0) {
      reasons.push("Enter annual rent paid before adding rent-period review facts.");
    }
    if (!start || !end) {
      reasons.push("Provide both the rent period start and end dates before estimating.");
    } else if (!isValidIsoDate(start) || !isValidIsoDate(end)) {
      reasons.push("Rent period dates must be valid calendar dates.");
    } else if (start > end) {
      reasons.push("Rent period end date must be on or after the start date.");
    } else if (start.slice(0, 4) !== taxYear || end.slice(0, 4) !== taxYear) {
      warnings.push("Rent period crosses tax years; use only the taxpayer-attributable rent for the assessment year.");
    }
    const shared = form.rentSharedWithOthers?.trim() ?? "";
    if (shared && !["yes", "no"].includes(shared)) {
      reasons.push("Confirm whether the rent was shared with other occupants.");
    } else if (shared === "yes") {
      warnings.push("Shared-tenancy rent requires evidence of the taxpayer's attributable share; the entered annual rent is treated as that share.");
    }
  }

  if (amounts.lifeInsurancePremium > 0) {
    const paidYear = form.lifeInsurancePremiumPaidYear?.trim() ?? "";
    const precedingYear = String(Number(taxYear) - 1);
    if (!/^\d{4}$/.test(paidYear)) {
      warnings.push(`Life-insurance or deferred-annuity premium was not confirmed as paid in the applicable preceding year (${precedingYear}); it is excluded from this estimate.`);
    } else if (paidYear !== precedingYear) {
      warnings.push(`Life-insurance or deferred-annuity premium paid outside the applicable preceding year (${precedingYear}) is excluded from this estimate.`);
    }
    if (form.lifeInsurancePremiumWithdrawn === "yes") {
      warnings.push("Withdrawn life-insurance or deferred-annuity premiums are excluded from this estimate.");
    }
    if (form.lifeInsuranceBeneficiary?.trim()) {
      warnings.push("Confirm that the recorded life-insurance or deferred-annuity beneficiary satisfies the applicable legal conditions.");
    }
  }

  if (amounts.mortgageInterest > 0 && form.mortgagePrincipalResidence?.trim() !== "yes") {
    if (form.mortgagePrincipalResidence?.trim() === "no") {
      warnings.push("Mortgage interest is excluded because the loan was not confirmed as relating to the taxpayer's principal residence.");
    } else {
      warnings.push("Mortgage interest is included provisionally; confirm that the loan relates to the taxpayer's principal residence and retain the loan schedule and occupancy evidence.");
    }
  }

  const employmentPeriod = form.employmentPeriod?.trim() ?? "";
  if (employmentPeriod && !["full_year", "part_year", "multiple_employers"].includes(employmentPeriod)) {
    reasons.push("Confirm the employment period before estimating.");
  }
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

/** 2026-only Nigeria Tax Act 2025 PIT estimate with an optional PAYE credit. */
export function calculateNigeriaTax(
  form: NigeriaDeclarationForm,
  ruleInputs: PitRuleInputs = getPitBaseline().ruleInputs,
): TaxBreakdown {
  const reasons: string[] = [];
  const taxYear = form.taxYear.trim();
  if (form.taxYear !== "2026") reasons.push("Only tax year 2026 has a reviewed Nigeria Tax Act 2025 calculation profile.");
  if (form.country && form.country !== "ng") reasons.push("This estimate covers Nigeria only.");

  const amounts = {} as Record<(typeof moneyFields)[number], number>;
  for (const field of moneyFields) amounts[field] = readAmount(form[field], field, reasons);

  const warnings: string[] = [];
  for (const [field, warning] of reviewWarnings) {
    if (amounts[field as (typeof moneyFields)[number]] > 0) warnings.push(warning);
  }
  if (amounts.businessExpenses > 0 && amounts.businessIncome === 0)
    reasons.push("Business expenses are entered but gross business income is zero; confirm the business income and expense records.");
  if (amounts.rentExpenses > 0 && amounts.rentIncome === 0)
    reasons.push("Rental expenses are entered but net rent income is zero; confirm the net figure.");
  if (amounts.rentPaidBySelf > 0 && amounts.rentPaidBySelf !== amounts.annualRentPaid)
    reasons.push("Confirm annual rent paid: the housing and deduction entries differ or the deduction entry is missing.");

  validateReviewFacts(form, amounts, reasons, warnings);

  const employment = roundCurrency(amounts.annualSalary + amounts.commissions + amounts.bonuses + amounts.allowances);
  if (form.minimumWageEmployment && !["yes", "no"].includes(form.minimumWageEmployment))
    reasons.push("Confirm the minimum-wage disclosure value.");
  if (reasons.length) throw new TaxEstimateUnavailableError(reasons);

  const businessExpenses = roundCurrency([
    amounts.businessExpenses,
    amounts.businessLoanInterest,
    amounts.businessPremisesRent,
    amounts.businessRepairsMaintenance,
    amounts.businessEmployeeRemuneration,
    amounts.businessBadDebts,
    amounts.businessProfessionalFees,
  ].reduce((sum, amount) => sum + amount, 0));
  const digitalAssetNetGains = roundCurrency(Math.max(0, amounts.digitalAssetGains - amounts.digitalAssetCharges));
  const excludedInvestmentIncome = roundCurrency(
    amounts.nigerianDividends + amounts.otherDividends + amounts.interestIncome + amounts.otherInvestmentIncome,
  );
  if (excludedInvestmentIncome > 0) {
    warnings.push("Investment income is disclosed separately and excluded from this automated PIT base only where final withholding tax applies; retain the supporting evidence.");
  }
  const disclosedUnclassifiedIncome = roundCurrency(
    amounts.pensionReceived + amounts.annuityInsurance + amounts.gratuities + amounts.rentPaidByEmployer +
    amounts.domesticStaffByEmployer + amounts.companyVehicleCost,
  );
  if (amounts.rentExpenses > 0) {
    warnings.push("Rental expenses are recorded for review but are not deducted by this automated estimate; confirm the applicable treatment before filing.");
  }
  const grossIncome = roundCurrency(
    employment + amounts.businessIncome + amounts.rentIncome + amounts.foreignIncome + digitalAssetNetGains,
  );
  const mortgageInterestDeduction = form.mortgagePrincipalResidence?.trim() === "no" ? 0 : amounts.mortgageInterest;
  const personalDeductions = roundCurrency(
    amounts.employeePension + amounts.nationalHousingFund + amounts.nationalHealthInsurance +
    mortgageInterestDeduction + (shouldIncludeInsurancePremium(form, amounts, taxYear) ? amounts.lifeInsurancePremium : 0) +
    calculateRentRelief(amounts.annualRentPaid).relief,
  );
  const totalDeductions = roundCurrency(businessExpenses + personalDeductions);
  const reportedIncome = roundCurrency(grossIncome + excludedInvestmentIncome + disclosedUnclassifiedIncome);
  const taxableIncome = roundCurrency(Math.max(0, grossIncome - totalDeductions));
  let remaining = taxableIncome;
  let lowerBound = 0;
  const bands: TaxBreakdown["bands"] = [];
  for (const band of ruleInputs.taxBands) {
    const income = Math.min(remaining, band.limit);
    bands.push({
      range: band.limit === Infinity
        ? `Above ₦${lowerBound.toLocaleString("en-NG")}`
        : `₦${lowerBound.toLocaleString("en-NG")} – ₦${(lowerBound + band.limit).toLocaleString("en-NG")}`,
      income: roundCurrency(income), rate: band.rate, tax: roundCurrency(income * band.rate),
    });
    remaining = roundCurrency(remaining - income);
    if (band.limit !== Infinity) lowerBound += band.limit;
  }
  const computedTax = roundCurrency(bands.reduce((sum, band) => sum + band.tax, 0));
  const payeCredit = amounts.payeAlreadySuffered;
  if (payeCredit > computedTax) warnings.push("PAYE entered exceeds this estimate; any resulting credit or refund requires review with the tax authority.");
  const estimatedBalanceAfterCredits = roundCurrency(Math.max(0, computedTax - payeCredit));
  return {
    grossIncome, reportedIncome, disclosedUnclassifiedIncome, excludedInvestmentIncome, businessExpenses,
    totalDeductions, taxableIncome, bands, computedTax, payeCredit,
    estimatedBalanceAfterCredits,
    finalTax: estimatedBalanceAfterCredits,
    effectiveRate: grossIncome ? roundCurrency(computedTax / grossIncome * 100) : 0,
    warnings,
  };
}

function shouldIncludeInsurancePremium(
  form: NigeriaDeclarationForm,
  amounts: Record<(typeof moneyFields)[number], number>,
  taxYear: string,
): boolean {
  if (amounts.lifeInsurancePremium <= 0 || form.lifeInsurancePremiumWithdrawn === "yes") return false;
  return form.lifeInsurancePremiumPaidYear?.trim() === String(Number(taxYear) - 1);
}
