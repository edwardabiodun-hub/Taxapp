import { describe, it, expect } from "vitest";
import { buildFilingSummary } from "./filing-summary";
import type { LocalDeclaration, LocalProfile } from "./local-db";
import { defaultNigeriaForm } from "@/types/declaration";

function declaration(overrides: Partial<LocalDeclaration> = {}): LocalDeclaration {
  return {
    id: "decl-1",
    taxYear: "2025",
    country: "ng",
    type: "Income Tax",
    status: "submitted",
    formData: { ...defaultNigeriaForm, annualSalary: "900000" },
    documents: [],
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    pendingSync: 0,
    ...overrides,
  };
}

function profile(overrides: Partial<LocalProfile> = {}): LocalProfile {
  return {
    id: "user-1",
    name: "Amara Okafor",
    email: "amara@example.com",
    phone: "+2348123456789",
    taxId: "A012345678Z",
    country: "ng",
    ...overrides,
  };
}

describe("buildFilingSummary", () => {
  it("carries the taxpayer's identifying details through unchanged", () => {
    const summary = buildFilingSummary(declaration(), profile());

    expect(summary.taxpayer.name).toBe("Amara Okafor");
    expect(summary.taxpayer.taxId).toBe("A012345678Z");
  });

  it("carries the declaration's tax year and type through unchanged", () => {
    const summary = buildFilingSummary(declaration({ taxYear: "2024", type: "VAT Return" }), profile());

    expect(summary.declaration.taxYear).toBe("2024");
    expect(summary.declaration.type).toBe("VAT Return");
  });

  it("recomputes the tax breakdown from the declaration's stored form data", () => {
    // 900,000 salary matches the tax-calculator.test.ts worked example:
    // CRA = 380,000; taxable = 520,000; computed tax = 45,200.
    const summary = buildFilingSummary(declaration(), profile());

    expect(summary.tax.finalTax).toBe(45200);
  });

  it("includes guidance naming where to actually file, since there is no direct government API integration", () => {
    const summary = buildFilingSummary(declaration(), profile());

    expect(summary.guidance.toLowerCase()).toContain("firs");
  });

  it("stamps a generation timestamp", () => {
    const before = Date.now();
    const summary = buildFilingSummary(declaration(), profile());
    const generatedAt = new Date(summary.generatedAt).getTime();

    expect(generatedAt).toBeGreaterThanOrEqual(before);
    expect(generatedAt).toBeLessThanOrEqual(Date.now());
  });

  it("includes the declaration's filed state in the summary", () => {
    const summary = buildFilingSummary(declaration({ state: "lagos" }), profile());

    expect(summary.declaration.state).toBe("lagos");
  });

  it("computes tax via the state-aware engine, exposing a stateLevies breakdown", () => {
    const summary = buildFilingSummary(declaration({ state: "lagos" }), profile());

    expect(summary.tax.stateLevies).toEqual([]);
  });

  it("falls through cleanly for a declaration with no state selected (e.g. created before this feature existed)", () => {
    const summary = buildFilingSummary(declaration(), profile());

    expect(summary.declaration.state).toBeUndefined();
    expect(summary.tax.finalTax).toBe(45200);
  });
});
