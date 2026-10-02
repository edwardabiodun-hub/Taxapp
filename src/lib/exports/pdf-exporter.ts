import type { ExportContext } from "@/domain/exports";
import { buildSanitizedExportModel, safeValue } from "@/lib/exports/export-data";

export const PDF_MIME_TYPE = "application/pdf";

export async function createPdfArtifact(
  context: ExportContext,
  fileName: string,
  artifactRef: string,
): Promise<{ format: "pdf"; fileName: string; mimeType: string; data: Blob; artifactRef: string }> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const model = buildSanitizedExportModel(context);
  const rows = model.rows;
  const summaryValue = (field: string, fallback = "Not configured") => rows.find((row) => row.section === "summary" && row.field === field)?.value || fallback;
  let y = 48;
  const write = (value: unknown, size = 10, bold = false) => {
    if (y > 770) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(safeValue(value), 500) as string[];
    doc.text(lines, 48, y);
    y += Math.max(16, lines.length * 13);
  };

  write("FileSmart universal tax preparation export", 16, true);
  write("This package is for review and manual upload only. It has not been submitted and does not confirm authority acceptance.", 10);
  y += 8;
  write(`Jurisdiction: ${summaryValue("jurisdiction")} (${summaryValue("jurisdiction_code")})`, 11, true);
  write("Selected authority: Not specified by the registry; confirm the current instructions with the relevant Nigerian tax authority.");
  write(`Tax year: ${summaryValue("tax_year")}`);
  write(`Calculation: ${summaryValue("calculation_label")}`);
  write(`Readiness: ${summaryValue("readiness")}`);
  write(`Rule profile: ${summaryValue("rule_profile_id")} ${summaryValue("rule_profile_version")}`);
  write(`Rule source: ${summaryValue("rule_source")}`);
  write(`Rule source verified at: ${summaryValue("rule_verified_at", "Not verified")}`);
  write(`Deadline source: ${summaryValue("deadline_source", "Not verified")}`);
  write(`Deadline verified at: ${summaryValue("deadline_verified_at", "Not verified")}`);
  write("Filing checklist", 12, true);
  write("[ ] Review the calculation, assumptions, missing items, and document index.");
  write("[ ] Confirm current authority requirements and add any required forms or documents.");
  write("[ ] Submit manually through the relevant authority channel, if eligible.");
  write("Status: Not submitted. FileSmart has not filed this preparation or received authority confirmation.");

  const missing = rows.filter((row) => row.section === "unresolved_items");
  write("Missing or unresolved items", 12, true);
  if (missing.length === 0) write("None recorded in the preparation.");
  for (const item of missing) write(`- ${item.value}`);

  write("Supporting documents", 12, true);
  const documents = rows.filter((row) => row.section === "document_index");
  if (documents.length === 0) write("No document references recorded.");
  for (const document of documents) {
    write(`${document.label} — ${document.status} — ${document.reference || "no reference"}`);
  }

  write("Assumptions", 12, true);
  for (const assumption of rows.filter((row) => row.section === "assumptions")) write(`- ${assumption.value}`);

  const output = doc.output("arraybuffer");
  return { format: "pdf", fileName, mimeType: PDF_MIME_TYPE, data: new Blob([output], { type: PDF_MIME_TYPE }), artifactRef };
}

export const exportPdf = createPdfArtifact;
