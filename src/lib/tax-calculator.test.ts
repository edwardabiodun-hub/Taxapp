import { describe, expect, it } from "vitest";
import { calculateNigeriaTax, TaxEstimateUnavailableError, formatNaira } from "./tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";

const form = (overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm =>
  ({ ...defaultNigeriaForm, taxYear: "2026", ...overrides });

describe("2026 Nigeria Tax Act PIT estimate", () => {
  it.each([
    ["800000", 0], ["1000000", 30000], ["3000000", 330000],
    ["12000000", 1950000], ["25000000", 4680000],
    ["50000000", 10430000], ["51000000", 10680000],
  ])("applies marginal bands to taxable income %s", (salary, expected) => {
    expect(calculateNigeriaTax(form({ annualSalary: salary })).finalTax).toBe(expected);
  });

  it("includes distinct commissions, bonuses and allowances exactly once", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "2000000", commissions: "100000", bonuses: "200000", allowances: "300000" }));
    expect(result.grossIncome).toBe(2600000);
    expect(result.finalTax).toBe(270000);
  });

  it("deducts documented eligible amounts and caps rent relief rather than rent", () => {
    const result = calculateNigeriaTax(form({
      annualSalary: "5000000", annualRentPaid: "3000000", employeePension: "200000",
      nationalHousingFund: "100000", nationalHealthInsurance: "100000",
      mortgageInterest: "100000", mortgagePrincipalResidence: "yes",
      lifeInsurancePremium: "100000", lifeInsurancePremiumPaidYear: "2025",
    }));
    expect(result.totalDeductions).toBe(1100000);
    expect(result.taxableIncome).toBe(3900000);
    expect(result.finalTax).toBe(492000);
  });

  it("treats business income as gross and deducts documented business expenses", () => {
    const result = calculateNigeriaTax(form({
      businessIncome: "5000000",
      businessLoanInterest: "280000",
      businessPremisesRent: "600000",
      businessRepairsMaintenance: "80000",
      businessEmployeeRemuneration: "1600000",
      businessBadDebts: "200000",
      businessProfessionalFees: "300000",
    }));
    expect(result.grossIncome).toBe(5000000);
    expect(result.businessExpenses).toBe(3060000);
    expect(result.totalDeductions).toBe(3060000);
    expect(result.taxableIncome).toBe(1940000);
    expect(result.finalTax).toBe(171000);
  });

  it("uses the progressive bands instead of a separate full-year minimum-wage exclusion", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "840000", minimumWageEmployment: "yes", businessIncome: "1000000" }));
    expect(result.grossIncome).toBe(1840000);
    expect(result.finalTax).toBe(156000);
  });

  it("subtracts PAYE already suffered without calling the result final PAYE", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "3600000", payeAlreadySuffered: "100000" }));
    expect(result.computedTax).toBe(438000);
    expect(result.payeCredit).toBe(100000);
    expect(result.estimatedBalanceAfterCredits).toBe(338000);
    expect(result.finalTax).toBe(338000);
  });

  it("includes foreign income with a treaty-review warning", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "1000000", foreignIncome: "1000000" }));
    expect(result.grossIncome).toBe(2000000);
    expect(result.finalTax).toBe(180000);
    expect(result.warnings.join(" ")).toMatch(/foreign income/i);
  });

  it("includes net digital-asset gains in chargeable income", () => {
    const result = calculateNigeriaTax(form({ digitalAssetGains: "1200000", digitalAssetCharges: "200000" }));
    expect(result.grossIncome).toBe(1000000);
    expect(result.finalTax).toBe(30000);
  });

  it("discloses dividend and interest income without taxing it again when final withholding tax applies", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "1000000", nigerianDividends: "100000", interestIncome: "50000" }));
    expect(result.grossIncome).toBe(1000000);
    expect(result.reportedIncome).toBe(1150000);
    expect(result.excludedInvestmentIncome).toBe(150000);
    expect(result.finalTax).toBe(30000);
  });

  it.each(["2025", "2027"])("does not apply 2026 law to %s", (taxYear) => {
    expect(() => calculateNigeriaTax(form({ taxYear, annualSalary: "1000000" }))).toThrow(TaxEstimateUnavailableError);
  });

  it.each([
    { companyVehicleCost: "1000000" }, { rentPaidByEmployer: "100000" },
    { pensionReceived: "100000" }, { otherInvestmentIncome: "100000" },
    { gratuities: "100000" }, { annuityInsurance: "100000" },
  ])("shows a review warning instead of suppressing the supported estimate %o", (unclassified) => {
    const result = calculateNigeriaTax(form({ annualSalary: "1000000", ...unclassified }));
    expect(result.finalTax).toBe(30000);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it.each(["1abc", "-1", "Infinity", "1.234", "1,00,000"])("rejects malformed amount %s", (amount) => {
    expect(() => calculateNigeriaTax(form({ annualSalary: amount }))).toThrow(TaxEstimateUnavailableError);
  });

  it("withholds an estimate for contradictory net income and expense entries", () => {
    expect(() => calculateNigeriaTax(form({ businessIncome: "0", businessExpenses: "20000" }))).toThrow(TaxEstimateUnavailableError);
  });

  it("does not silently choose between conflicting annual rent entries", () => {
    expect(() => calculateNigeriaTax(form({ annualSalary: "3000000", annualRentPaid: "1000000", rentPaidBySelf: "1200000" }))).toThrow(TaxEstimateUnavailableError);
    expect(() => calculateNigeriaTax(form({ annualSalary: "3000000", rentPaidBySelf: "1200000" }))).toThrow(TaxEstimateUnavailableError);
  });

  it("does not require a minimum-wage classification in the narrow exemption interval", () => {
    expect(calculateNigeriaTax(form({ annualSalary: "820000" })).finalTax).toBe(3000);
  });

  it("keeps an estimate and warns when rent allocation needs taxpayer review", () => {
    const crossYear = calculateNigeriaTax(form({
      annualSalary: "3000000", annualRentPaid: "1200000",
      rentPeriodStart: "2025-10-01", rentPeriodEnd: "2026-09-30",
    }));
    expect(crossYear.warnings.join(" ")).toMatch(/rent/i);
    const shared = calculateNigeriaTax(form({
      annualSalary: "3000000", annualRentPaid: "1200000",
      rentPeriodStart: "2026-01-01", rentPeriodEnd: "2026-12-31",
      rentSharedWithOthers: "yes",
    }));
    expect(shared.warnings.join(" ")).toMatch(/shared/i);
  });

  it("keeps an estimate and warns when review facts are incomplete", () => {
    const missingInsuranceYear = calculateNigeriaTax(form({ annualSalary: "3000000", lifeInsurancePremium: "100000" }));
    expect(missingInsuranceYear.finalTax).toBe(330000);
    expect(missingInsuranceYear.totalDeductions).toBe(0);
    expect(missingInsuranceYear.warnings.join(" ")).toMatch(/preceding year/i);
    const wrongInsuranceYear = calculateNigeriaTax(form({ annualSalary: "3000000", lifeInsurancePremium: "100000", lifeInsurancePremiumPaidYear: "2026" }));
    expect(wrongInsuranceYear.totalDeductions).toBe(0);
    const mortgage = calculateNigeriaTax(form({ annualSalary: "3000000", mortgageInterest: "100000" }));
    expect(mortgage.finalTax).toBe(315000);
    expect(mortgage.warnings.join(" ")).toMatch(/principal residence/i);
  });

  it("excludes mortgage interest when the property is explicitly not the principal residence", () => {
    const mortgage = calculateNigeriaTax(form({
      annualSalary: "3000000", mortgageInterest: "100000", mortgagePrincipalResidence: "no",
    }));
    expect(mortgage.finalTax).toBe(330000);
    expect(mortgage.warnings.join(" ")).toMatch(/excluded/i);
  });

  it("preserves the approved calculation when review facts are complete and unambiguous", () => {
    const result = calculateNigeriaTax(form({
      annualSalary: "5000000", annualRentPaid: "3000000",
      employeePension: "200000", nationalHousingFund: "100000", nationalHealthInsurance: "100000",
      rentPeriodStart: "2026-01-01", rentPeriodEnd: "2026-12-31", rentSharedWithOthers: "no",
      mortgageInterest: "100000", mortgagePrincipalResidence: "yes",
      lifeInsurancePremium: "100000", lifeInsurancePremiumPaidYear: "2025",
      employmentPeriod: "full_year",
    }));
    expect(result.finalTax).toBe(492000);
  });

  it("does not apply a separate minimum-wage exclusion to a part-year context", () => {
    expect(calculateNigeriaTax(form({
      annualSalary: "840000", minimumWageEmployment: "yes", employmentPeriod: "part_year",
    })).finalTax).toBe(6000);
  });

  it("does not apply legacy CRA or minimum tax", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "100000" }));
    expect(result.totalDeductions).toBe(0);
    expect(result.finalTax).toBe(0);
    expect(result).not.toHaveProperty("minimumTax");
  });
});

describe("formatNaira", () => {
  it("formats the naira symbol", () => expect(formatNaira(1234.57)).toBe("₦1,235"));
});
