import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import { calculateNigeriaTax, TaxEstimateUnavailableError, type TaxBreakdown } from "./tax-calculator";

export interface PayeCalculatorInput {
  monthlyGrossSalary: string;
  monthlyCommissions: string;
  monthlyBonuses: string;
  monthlyAllowances: string;
  monthlyPension: string;
  monthlyNhf: string;
  monthlyNhis: string;
  annualRentPaid: string;
  lifeInsurancePremium: string;
  monthlyPayeAlreadySuffered: string;
}

export interface PayeCalculationResult {
  annualGrossIncome: number;
  annualDeductions: number;
  annualPaye: number;
  monthlyPaye: number;
  annualPayeCredit: number;
  estimatedBalanceAfterCredits: number;
  monthlyEmployeeContributions: number;
  estimatedMonthlyTakeHome: number;
  effectiveRate: number;
  bands: TaxBreakdown["bands"];
  warnings: readonly string[];
}

const MONEY_PATTERN = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/;

function readMoney(value: string, label: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (!MONEY_PATTERN.test(trimmed)) {
    throw new TaxEstimateUnavailableError([`${label} must be a non-negative amount with at most two decimal places.`]);
  }

  const amount = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) {
    throw new TaxEstimateUnavailableError([`${label} is too large to estimate safely.`]);
  }
  return amount;
}

function annualize(amount: number): string {
  return String(Math.round(amount * 12 * 100) / 100);
}

function buildNigeriaForm(input: PayeCalculatorInput): {
  form: NigeriaDeclarationForm;
  monthlyGrossEarnings: number;
  monthlyEmployeeContributions: number;
} {
  const monthlyGrossSalary = readMoney(input.monthlyGrossSalary, "Monthly gross salary");
  const monthlyCommissions = readMoney(input.monthlyCommissions, "Monthly commissions");
  const monthlyBonuses = readMoney(input.monthlyBonuses, "Monthly bonuses");
  const monthlyAllowances = readMoney(input.monthlyAllowances, "Monthly allowances");
  const monthlyPension = readMoney(input.monthlyPension, "Monthly pension contribution");
  const monthlyNhf = readMoney(input.monthlyNhf, "Monthly NHF contribution");
  const monthlyNhis = readMoney(input.monthlyNhis, "Monthly NHIS contribution");
  const monthlyPayeAlreadySuffered = readMoney(input.monthlyPayeAlreadySuffered, "Monthly PAYE already suffered");
  const annualRentPaid = readMoney(input.annualRentPaid, "Annual rent paid");
  const lifeInsurancePremium = readMoney(input.lifeInsurancePremium, "Qualifying life-insurance premium");

  const monthlyGrossEarnings = monthlyGrossSalary + monthlyCommissions + monthlyBonuses + monthlyAllowances;
  const monthlyEmployeeContributions = monthlyPension + monthlyNhf + monthlyNhis;

  return {
    form: {
      ...defaultNigeriaForm,
      taxYear: "2026",
      country: "ng",
      annualSalary: annualize(monthlyGrossSalary),
      commissions: annualize(monthlyCommissions),
      bonuses: annualize(monthlyBonuses),
      allowances: annualize(monthlyAllowances),
      employeePension: annualize(monthlyPension),
      nationalHousingFund: annualize(monthlyNhf),
      nationalHealthInsurance: annualize(monthlyNhis),
      annualRentPaid: String(annualRentPaid),
      lifeInsurancePremium: String(lifeInsurancePremium),
      lifeInsurancePremiumPaidYear: lifeInsurancePremium > 0 ? "2025" : "",
      payeAlreadySuffered: annualize(monthlyPayeAlreadySuffered),
    },
    monthlyGrossEarnings,
    monthlyEmployeeContributions,
  };
}

export function calculatePayeEstimate(input: PayeCalculatorInput): PayeCalculationResult {
  const { form, monthlyGrossEarnings, monthlyEmployeeContributions } = buildNigeriaForm(input);
  const calculation = calculateNigeriaTax(form);

  if (calculation.reportedIncome <= 0) {
    throw new TaxEstimateUnavailableError(["Enter a monthly gross salary or another employment-income amount before calculating PAYE."]);
  }

  const monthlyPaye = Math.round((calculation.computedTax / 12 + Number.EPSILON) * 100) / 100;
  const estimatedMonthlyTakeHome = Math.max(0, Math.round((monthlyGrossEarnings - monthlyEmployeeContributions - monthlyPaye + Number.EPSILON) * 100) / 100);

  return {
    annualGrossIncome: calculation.grossIncome,
    annualDeductions: calculation.totalDeductions,
    annualPaye: calculation.computedTax,
    monthlyPaye,
    annualPayeCredit: calculation.payeCredit,
    estimatedBalanceAfterCredits: calculation.estimatedBalanceAfterCredits,
    monthlyEmployeeContributions,
    estimatedMonthlyTakeHome,
    effectiveRate: calculation.effectiveRate,
    bands: calculation.bands,
    warnings: calculation.warnings,
  };
}
