import type { NigeriaDeclarationForm } from "@/types/declaration";

/**
 * Nigerian PIT bands (Personal Income Tax Act)
 * Based on current rates from PWC/FIRS
 */
const TAX_BANDS = [
  { limit: 300_000, rate: 0.07 },
  { limit: 300_000, rate: 0.11 },
  { limit: 500_000, rate: 0.15 },
  { limit: 500_000, rate: 0.19 },
  { limit: 1_600_000, rate: 0.21 },
  { limit: Infinity, rate: 0.24 },
];

const MINIMUM_TAX_RATE = 0.01; // 1% of gross income

export interface TaxBreakdown {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  bands: { range: string; income: number; rate: number; tax: number }[];
  computedTax: number;
  minimumTax: number;
  finalTax: number;
  effectiveRate: number;
}

function parseAmount(val: string): number {
  const cleaned = val.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.max(0, num);
}

export function calculateNigeriaTax(form: NigeriaDeclarationForm): TaxBreakdown {
  // Earned income (taxable portions)
  const employment =
    parseAmount(form.annualSalary) +
    parseAmount(form.commissions) +
    parseAmount(form.allowances);
  const business = parseAmount(form.businessIncome);
  const annuityTaxable = parseAmount(form.annuityInsurance); // pension & gratuities are exempt
  const foreign = parseAmount(form.foreignIncome);

  // Investment income (taxable portions — dividends & interest are exempt via WHT)
  const rentNet = parseAmount(form.rentIncome);
  const otherInvestment = parseAmount(form.otherInvestmentIncome);

  // Benefits in kind (taxable)
  const rentByEmployer = parseAmount(form.rentPaidByEmployer);
  const domesticByEmployer = parseAmount(form.domesticStaffByEmployer);
  const vehicleBenefit = parseAmount(form.companyVehicleCost) * 0.1; // 10% per annum

  const grossIncome =
    employment + business + annuityTaxable + foreign +
    rentNet + otherInvestment +
    rentByEmployer + domesticByEmployer + vehicleBenefit;

  // Deductions
  const pensionDeduction = parseAmount(form.employeePension);
  const rentPaid = parseAmount(form.annualRentPaid);
  const rentRelief = Math.min(rentPaid * 0.2, 500_000);
  // Consolidated Relief Allowance (CRA): higher of ₦200,000 or 1% of gross + 20% of gross
  const craFixed = Math.max(200_000, grossIncome * 0.01);
  const craVariable = grossIncome * 0.20;
  const cra = craFixed + craVariable;

  const totalDeductions = pensionDeduction + rentRelief + cra;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  // Apply graduated bands
  let remaining = taxableIncome;
  let computedTax = 0;
  let cumulative = 0;
  const bands: TaxBreakdown["bands"] = [];

  for (const band of TAX_BANDS) {
    const taxableInBand = Math.min(remaining, band.limit);
    if (taxableInBand <= 0) {
      bands.push({
        range: band.limit === Infinity
          ? `Above ₦${(cumulative).toLocaleString()}`
          : `₦${cumulative.toLocaleString()} – ₦${(cumulative + band.limit).toLocaleString()}`,
        income: 0,
        rate: band.rate,
        tax: 0,
      });
      cumulative += band.limit === Infinity ? 0 : band.limit;
      continue;
    }
    const tax = taxableInBand * band.rate;
    bands.push({
      range: band.limit === Infinity
        ? `Above ₦${cumulative.toLocaleString()}`
        : `₦${cumulative.toLocaleString()} – ₦${(cumulative + band.limit).toLocaleString()}`,
      income: taxableInBand,
      rate: band.rate,
      tax,
    });
    computedTax += tax;
    remaining -= taxableInBand;
    cumulative += band.limit === Infinity ? 0 : band.limit;
  }

  // Minimum tax: 1% of gross income (whichever is higher applies)
  const minimumTax = grossIncome * MINIMUM_TAX_RATE;
  const finalTax = Math.max(computedTax, minimumTax);
  const effectiveRate = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    bands,
    computedTax,
    minimumTax,
    finalTax,
    effectiveRate,
  };
}
