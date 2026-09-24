import { describe, it, expect } from "vitest";
import { renderFilingSummaryPdf } from "./filing-summary-pdf";
import type { FilingSummary } from "./filing-summary";

function summary(overrides: Partial<FilingSummary> = {}): FilingSummary {
  return {
    generatedAt: "2026-01-15T00:00:00.000Z",
    taxpayer: { name: "Amara Okafor", taxId: "A012345678Z", country: "ng" },
    declaration: { taxYear: "2025", type: "Income Tax", status: "submitted" },
    tax: {
      grossIncome: 900000,
      totalDeductions: 380000,
      taxableIncome: 520000,
      bands: [
        { range: "NGN 0 – NGN 300,000", income: 300000, rate: 0.07, tax: 21000 },
        { range: "NGN 300,000 – NGN 600,000", income: 220000, rate: 0.11, tax: 24200 },
      ],
      computedTax: 45200,
      minimumTax: 9000,
      finalTax: 45200,
      effectiveRate: 5.02,
    },
    guidance: "File with FIRS or your state's Internal Revenue Service.",
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
});
