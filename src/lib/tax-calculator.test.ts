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

  it("keeps net business and net rent income without double-subtracting recorded expenses", () => {
    const result = calculateNigeriaTax(form({ businessIncome: "2000000", businessExpenses: "300000", rentIncome: "1000000", rentExpenses: "200000" }));
    expect(result.grossIncome).toBe(3000000);
    expect(result.finalTax).toBe(330000);
  });

  it("exempts confirmed full-year single minimum-wage employment only, not other income", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "840000", minimumWageEmployment: "yes", businessIncome: "1000000" }));
    expect(result.grossIncome).toBe(1000000);
    expect(result.finalTax).toBe(30000);
  });

  it.each(["2025", "2027"])("does not apply 2026 law to %s", (taxYear) => {
    expect(() => calculateNigeriaTax(form({ taxYear, annualSalary: "1000000" }))).toThrow(TaxEstimateUnavailableError);
  });

  it.each([
    { companyVehicleCost: "1000000" }, { rentPaidByEmployer: "100000" },
    { foreignIncome: "100000" }, { nigerianDividends: "100000" },
    { pensionReceived: "100000" }, { otherInvestmentIncome: "100000" },
    { gratuities: "100000" }, { annuityInsurance: "100000" },
  ])("withholds estimates for unclassified income or benefit %o", (unsupported) => {
    expect(() => calculateNigeriaTax(form({ annualSalary: "1000000", ...unsupported }))).toThrow(TaxEstimateUnavailableError);
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

  it("requires a confirmed minimum-wage classification in the narrow exemption interval", () => {
    expect(() => calculateNigeriaTax(form({ annualSalary: "820000" }))).toThrow(TaxEstimateUnavailableError);
  });

  it("withholds an estimate when rent spans years or is shared without allocation review", () => {
    expect(() => calculateNigeriaTax(form({
      annualSalary: "3000000", annualRentPaid: "1200000",
      rentPeriodStart: "2025-10-01", rentPeriodEnd: "2026-09-30",
    }))).toThrow(TaxEstimateUnavailableError);
    expect(() => calculateNigeriaTax(form({
      annualSalary: "3000000", annualRentPaid: "1200000",
      rentPeriodStart: "2026-01-01", rentPeriodEnd: "2026-12-31",
      rentSharedWithOthers: "yes",
    }))).toThrow(TaxEstimateUnavailableError);
  });

  it("withholds an estimate when insurance timing or mortgage residence is unconfirmed", () => {
    expect(() => calculateNigeriaTax(form({ annualSalary: "3000000", lifeInsurancePremium: "100000" }))).toThrow(TaxEstimateUnavailableError);
    expect(() => calculateNigeriaTax(form({ annualSalary: "3000000", lifeInsurancePremium: "100000", lifeInsurancePremiumPaidYear: "2026" }))).toThrow(TaxEstimateUnavailableError);
    expect(() => calculateNigeriaTax(form({ annualSalary: "3000000", mortgageInterest: "100000" }))).toThrow(TaxEstimateUnavailableError);
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

  it("does not apply the minimum-wage treatment to a part-year employment context", () => {
    expect(() => calculateNigeriaTax(form({
      annualSalary: "840000", minimumWageEmployment: "yes", employmentPeriod: "part_year",
    }))).toThrow(TaxEstimateUnavailableError);
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
