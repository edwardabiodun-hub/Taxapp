import { describe, it, expect } from "vitest";
import { calculateStateTax } from "./state-tax";
import { calculateNigeriaTax } from "@/lib/tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import type { StateJurisdiction } from "./jurisdictions";

function form(overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm {
  return { ...defaultNigeriaForm, ...overrides };
}

describe("calculateStateTax", () => {
  it.each(["lagos", "ogun", "oyo", "osun"])(
    "falls through to the federal baseline for %s (no confirmed exceptions yet)",
    (stateCode) => {
      const input = form({ annualSalary: "900000" });
      const federal = calculateNigeriaTax(input);

      const result = calculateStateTax(input, stateCode);

      expect(result).toEqual({ ...federal, stateLevies: [] });
    }
  );

  it("falls through to the federal baseline for an unrecognized state code", () => {
    const input = form({ annualSalary: "900000" });
    const federal = calculateNigeriaTax(input);

    const result = calculateStateTax(input, "not-a-real-state");

    expect(result).toEqual({ ...federal, stateLevies: [] });
  });

  it("falls through to the federal baseline when no state is selected (e.g. a declaration created before this feature existed)", () => {
    const input = form({ annualSalary: "900000" });
    const federal = calculateNigeriaTax(input);

    const result = calculateStateTax(input, "");

    expect(result).toEqual({ ...federal, stateLevies: [] });
  });

  it("sums multiple state levies and rounds the final tax to kobo precision", () => {
    const testJurisdictions: Record<string, StateJurisdiction> = {
      "test-state": {
        code: "test-state",
        overrides: {
          levies: () => [
            { label: "Development Levy", amount: 1000.555 },
            { label: "Infrastructure Levy", amount: 500.111 },
          ],
        },
      },
    };

    const result = calculateStateTax(form({ annualSalary: "900000" }), "test-state", testJurisdictions);

    // federal finalTax for this input is 45200 (tax-calculator.test.ts's worked example)
    // 45200 + 1000.555 + 500.111 = 46700.666 -> rounds to 46700.67
    expect(result.finalTax).toBe(46700.67);
    expect(result.stateLevies).toEqual([
      { label: "Development Levy", amount: 1000.555 },
      { label: "Infrastructure Levy", amount: 500.111 },
    ]);
  });

  it("applies a finalTaxOverride in place of the federal final tax, with levies added on top", () => {
    const testJurisdictions: Record<string, StateJurisdiction> = {
      "test-state": {
        code: "test-state",
        overrides: {
          finalTaxOverride: () => 50000,
          levies: () => [{ label: "Flat Levy", amount: 1000 }],
        },
      },
    };

    const result = calculateStateTax(form({ annualSalary: "900000" }), "test-state", testJurisdictions);

    expect(result.finalTax).toBe(51000);
  });
});
