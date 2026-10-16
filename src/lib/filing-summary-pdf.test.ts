import { describe, it, expect } from "vitest";
import { renderFilingSummaryPdf } from "./filing-summary-pdf";
import type { FilingSummary } from "./filing-summary";

function summary(overrides: Partial<FilingSummary> = {}): FilingSummary {
  return {
    generatedAt: "2026-01-15T00:00:00.000Z",
    taxpayer: { name: "Amara Okafor", taxId: "A012345678Z", country: "ng" },
    declaration: { taxYear: "2026", type: "Income Tax", status: "submitted", state: "lagos" },
    tax: {
      grossIncome: 900000,
      totalDeductions: 0,
      taxableIncome: 900000,
      bands: [
        { range: "NGN 0 – NGN 800,000", income: 800000, rate: 0, tax: 0 },
        { range: "NGN 800,000 – NGN 3,000,000", income: 100000, rate: 0.15, tax: 15000 },
      ],
      computedTax: 15000,
      finalTax: 15000,
      effectiveRate: 1.67,
      stateLevies: [],
    },
    guidance: "File with FIRS or your state's Internal Revenue Service.",
    estimateWarnings: [],
    ...overrides,
  };
}

describe("renderFilingSummaryPdf", () => {
  it("produces a valid PDF blob", async () => {
    const blob = renderFilingSummaryPdf(summary());

    expect(blob.type).toBe("application/pdf");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const header = new TextDecoder().decode(bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("produces a non-trivial file (not just an empty page)", async () => {
    const blob = renderFilingSummaryPdf(summary());
    expect(blob.size).toBeGreaterThan(500);
  });

  it("omits all numeric PIT amounts for an unsupported historical return", async () => {
    const blob = renderFilingSummaryPdf(summary({
      declaration: { taxYear: "2025", type: "Income Tax", status: "submitted", state: "lagos" },
      tax: null,
      estimateWarnings: ["Only tax year 2026 has a reviewed calculation profile."],
    }));
    const pdfText = await blob.text();
    expect(pdfText).toContain("Unavailable - review required");
    expect(pdfText).not.toContain("NGN 15,000");
  });
});
