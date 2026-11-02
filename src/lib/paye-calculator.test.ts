import { describe, expect, it } from "vitest";
import { TaxEstimateUnavailableError } from "./tax-calculator";
import { calculatePayeEstimate, type PayeCalculatorInput } from "./paye-calculator";

const baseInput: PayeCalculatorInput = {
  monthlyGrossSalary: "300000",
  monthlyCommissions: "",
  monthlyBonuses: "",
  monthlyAllowances: "",
  monthlyPension: "",
  monthlyNhf: "",
  monthlyNhis: "",
  annualRentPaid: "",
  lifeInsurancePremium: "",
  monthlyPayeAlreadySuffered: "",
};

describe("calculatePayeEstimate", () => {
  it("annualizes salary and returns the approved progressive PAYE estimate", () => {
    const result = calculatePayeEstimate(baseInput);

    expect(result.annualGrossIncome).toBe(3_600_000);
    expect(result.annualPaye).toBe(438_000);
    expect(result.monthlyPaye).toBe(36_500);
    expect(result.estimatedMonthlyTakeHome).toBe(263_500);
  });

  it("uses actual payslip contributions and rent relief as deductions", () => {
    const result = calculatePayeEstimate({
      ...baseInput,
      monthlyPension: "24000",
      monthlyNhf: "2000",
      monthlyNhis: "4000",
      annualRentPaid: "1200000",
    });

    expect(result.monthlyEmployeeContributions).toBe(30_000);
    expect(result.annualDeductions).toBe(600_000);
    expect(result.annualPaye).toBe(330_000);
    expect(result.monthlyPaye).toBe(27_500);
    expect(result.estimatedMonthlyTakeHome).toBe(242_500);
  });

  it("keeps PAYE credit separate from computed PAYE and reports the estimated balance", () => {
    const result = calculatePayeEstimate({ ...baseInput, monthlyPayeAlreadySuffered: "30000" });

    expect(result.annualPaye).toBe(438_000);
    expect(result.annualPayeCredit).toBe(360_000);
    expect(result.estimatedBalanceAfterCredits).toBe(78_000);
  });

  it("returns a zero-tax estimate for annualized income within the zero-rate band", () => {
    const result = calculatePayeEstimate({ ...baseInput, monthlyGrossSalary: "50000" });

    expect(result.annualGrossIncome).toBe(600_000);
    expect(result.annualPaye).toBe(0);
    expect(result.monthlyPaye).toBe(0);
  });

  it("rejects an invalid money value instead of producing a numeric result", () => {
    expect(() => calculatePayeEstimate({ ...baseInput, monthlyGrossSalary: "-1" })).toThrow(TaxEstimateUnavailableError);
  });
});
