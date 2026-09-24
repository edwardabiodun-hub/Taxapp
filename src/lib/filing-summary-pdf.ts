import { jsPDF } from "jspdf";
import type { FilingSummary } from "./filing-summary";
import { stateName } from "@/types/declaration";

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4, mm

function formatNgn(amount: number): string {
  return `NGN ${Math.round(amount).toLocaleString("en-NG")}`;
}

/** Renders a FilingSummary as a downloadable PDF the user can take to the
 * tax authority or their own accountant. Pure layout/formatting — all the
 * actual data (including the tax recomputation) comes from
 * buildFilingSummary(), which is what's unit-tested for correctness; this
 * module is covered by a smoke test only (valid PDF, non-trivial size). */
export function renderFilingSummaryPdf(summary: FilingSummary): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const heading = (text: string, size = 14) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.text(text, MARGIN, y);
    y += size / 2.5;
  };

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, MARGIN, y);
    doc.text(value, PAGE_WIDTH - MARGIN, y, { align: "right" });
    y += 6;
  };

  const rule = () => {
    doc.setDrawColor(200);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 6;
  };

  heading("Tax Filing Summary", 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date(summary.generatedAt).toLocaleString("en-NG")}`, MARGIN, y);
  doc.setTextColor(0);
  y += 10;

  heading("Taxpayer");
  y += 2;
  row("Name", summary.taxpayer.name);
  row("Tax Identification Number", summary.taxpayer.taxId);
  row("Country", summary.taxpayer.country.toUpperCase());
  y += 4;
  rule();

  heading("Declaration");
  y += 2;
  row("Tax Year", summary.declaration.taxYear);
  row("State", stateName(summary.declaration.state));
  row("Type", summary.declaration.type);
  row("Status", summary.declaration.status);
  y += 4;
  rule();

  heading("Tax Computation");
  y += 2;
  row("Gross Income", formatNgn(summary.tax.grossIncome));
  row("Total Deductions", formatNgn(summary.tax.totalDeductions));
  row("Taxable Income", formatNgn(summary.tax.taxableIncome));
  y += 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Band Breakdown", MARGIN, y);
  y += 6;
  for (const band of summary.tax.bands) {
    if (band.income <= 0) continue;
    row(`${band.range} @ ${(band.rate * 100).toFixed(0)}%`, formatNgn(band.tax));
  }
  y += 2;

  row("Computed Tax", formatNgn(summary.tax.computedTax));
  row("Minimum Tax (1%)", formatNgn(summary.tax.minimumTax));
  y += 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Estimated Tax Payable", MARGIN, y);
  doc.text(formatNgn(summary.tax.finalTax), PAGE_WIDTH - MARGIN, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Effective rate: ${summary.tax.effectiveRate.toFixed(1)}%`, MARGIN, y);
  y += 10;
  rule();

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(90);
  const guidanceLines = doc.splitTextToSize(summary.guidance, PAGE_WIDTH - MARGIN * 2);
  doc.text(guidanceLines, MARGIN, y);

  return doc.output("blob");
}
