import { describe, it, expect } from "vitest";
import { calculateNigeriaTax } from "./tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";

function form(overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm {
  return { ...defaultNigeriaForm, ...overrides };
}

describe("calculateNigeriaTax", () => {
  it("computes tax for income spanning the first two PIT bands", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "900000" }));
    // CRA = max(200000, 1% of 900000) + 20% of 900000 = 200000 + 180000 = 380000
    // taxable = 900000 - 380000 = 520000
    // band1: 300000 @ 7% = 21000; band2: 220000 @ 11% = 24200
    expect(result.totalDeductions).toBe(380000);
    expect(result.taxableIncome).toBe(520000);
    expect(result.computedTax).toBe(45200);
    expect(result.finalTax).toBe(45200);
  });

  it("applies the 1% minimum tax floor when banded tax is lower", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "100000" }));
    expect(result.taxableIncome).toBe(0);
    expect(result.computedTax).toBe(0);
    expect(result.minimumTax).toBe(1000); // 1% of 100000
    expect(result.finalTax).toBe(1000);
  });

  it("caps rent relief at NGN 500,000 even when 20% of rent paid exceeds it", () => {
    const withCap = calculateNigeriaTax(form({ annualSalary: "5000000", annualRentPaid: "3000000" }));
    const atCap = calculateNigeriaTax(form({ annualSalary: "5000000", annualRentPaid: "2500000" }));
    // CRA = max(200000, 50000) + 1000000 = 1200000; rent relief capped at 500000 in both cases
    expect(withCap.totalDeductions).toBe(1700000);
    expect(atCap.totalDeductions).toBe(1700000);
  });

  it("taxes 10% of company vehicle cost as a benefit in kind", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "0", companyVehicleCost: "1000000" }));
    expect(result.grossIncome).toBe(100000);
  });

  it("treats a non-numeric amount field as zero rather than NaN", () => {
    const result = calculateNigeriaTax(form({ annualSalary: "not a number" }));
    expect(result.grossIncome).toBe(0);
    expect(Number.isNaN(result.finalTax)).toBe(false);
  });

  it("rounds monetary results to 2 decimal places (kobo precision)", () => {
    // Gross income with cents, entirely absorbed by CRA relief, leaves only the
    // 1% minimum tax. Today that computes 123456.78 * 0.01 = 1234.5678 raw,
    // a 4-decimal-place amount that cannot exist in Naira/kobo currency.
    const result = calculateNigeriaTax(form({ annualSalary: "123456.78" }));
    expect(result.minimumTax).toBe(1234.57);
    expect(result.finalTax).toBe(1234.57);
    expect(result.totalDeductions).toBe(224691.36);
  });
});
