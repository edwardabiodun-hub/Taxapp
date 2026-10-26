import { getPitBaseline, type PitRuleInputs } from "@/data/pit-baseline";
import { calculateRentRelief } from "@/lib/rent-relief";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface TaxBreakdown {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  bands: { range: string; income: number; rate: number; tax: number }[];
  computedTax: number;
  finalTax: number;
  effectiveRate: number;
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
  "pensionReceived", "annuityInsurance", "gratuities", "foreignIncome", "nigerianDividends",
  "otherDividends", "interestIncome", "rentIncome", "rentExpenses", "otherInvestmentIncome",
  "rentPaidBySelf", "rentPaidByEmployer", "domesticStaffBySelf", "domesticStaffByEmployer",
  "companyVehicleCost", "employeePension", "annualRentPaid", "nationalHousingFund",
  "nationalHealthInsurance", "mortgageInterest", "lifeInsurancePremium",
] as const;

const unsupportedFields: readonly [keyof NigeriaDeclarationForm, string][] = [
  ["pensionReceived", "Pension treatment needs confirmation before estimating."],
  ["annuityInsurance", "Annuity income needs classification before estimating."],
  ["gratuities", "Gratuity treatment needs confirmation before estimating."],
  ["foreignIncome", "Foreign income and any applicable relief need review before estimating."],
  ["nigerianDividends", "Dividend treatment needs review before estimating."],
  ["otherDividends", "Dividend treatment needs review before estimating."],
  ["interestIncome", "Interest-income treatment needs review before estimating."],
  ["otherInvestmentIncome", "Other investment income needs classification before estimating."],
  ["rentPaidByEmployer", "Employer-provided housing needs valuation before estimating."],
  ["domesticStaffByEmployer", "Employer-provided domestic staff need valuation before estimating."],
  ["companyVehicleCost", "Company vehicle ownership or hire details are needed before estimating."],
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

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

/** 2026-only gross PIT estimate before PAYE/withholding-tax credits. */
export function calculateNigeriaTax(
  form: NigeriaDeclarationForm,
  ruleInputs: PitRuleInputs = getPitBaseline().ruleInputs,
): TaxBreakdown {
  const reasons: string[] = [];
  if (form.taxYear !== "2026") reasons.push("Only tax year 2026 has a reviewed Nigeria Tax Act 2025 calculation profile.");
  if (form.country && form.country !== "ng") reasons.push("This estimate covers Nigeria only.");

  const amounts = {} as Record<(typeof moneyFields)[number], number>;
  for (const field of moneyFields) amounts[field] = readAmount(form[field], field, reasons);

  for (const [field, reason] of unsupportedFields) {
    if (amounts[field as (typeof moneyFields)[number]] > 0) reasons.push(reason);
  }
  if (amounts.businessExpenses > 0 && amounts.businessIncome === 0)
    reasons.push("Business expenses are entered but net business income is zero; confirm the net figure.");
  if (amounts.rentExpenses > 0 && amounts.rentIncome === 0)
    reasons.push("Rental expenses are entered but net rent income is zero; confirm the net figure.");
  if (amounts.rentPaidBySelf > 0 && amounts.rentPaidBySelf !== amounts.annualRentPaid)
    reasons.push("Confirm annual rent paid: the housing and deduction entries differ or the deduction entry is missing.");

  const employment = roundCurrency(amounts.annualSalary + amounts.commissions + amounts.bonuses + amounts.allowances);
  const minimumWageStatus = form.minimumWageEmployment ?? "";
  if (minimumWageStatus && !["yes", "no"].includes(minimumWageStatus))
    reasons.push("Confirm whether this is single full-year minimum-wage employment.");
  if (minimumWageStatus === "yes" && employment > ruleInputs.minimumWageAnnual)
    reasons.push("Minimum-wage employment exemption cannot be used above the verified annual minimum wage.");
  if (employment > 800_000 && employment <= ruleInputs.minimumWageAnnual && !minimumWageStatus)
    reasons.push("Confirm whether this is single full-year minimum-wage employment before estimating.");
  if (reasons.length) throw new TaxEstimateUnavailableError(reasons);

  const grossIncome = roundCurrency(
    (minimumWageStatus === "yes" ? 0 : employment) + amounts.businessIncome + amounts.rentIncome,
  );
  const totalDeductions = roundCurrency(
    amounts.employeePension + amounts.nationalHousingFund + amounts.nationalHealthInsurance +
    amounts.mortgageInterest + amounts.lifeInsurancePremium +
    calculateRentRelief(amounts.annualRentPaid).relief,
  );
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
  return {
    grossIncome, totalDeductions, taxableIncome, bands, computedTax,
    finalTax: computedTax,
    effectiveRate: grossIncome ? roundCurrency(computedTax / grossIncome * 100) : 0,
  };
}
