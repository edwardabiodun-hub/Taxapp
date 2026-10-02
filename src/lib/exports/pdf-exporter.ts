import type { ExportContext } from "@/domain/exports";
import { buildExportRows, safeValue } from "@/lib/exports/export-data";

export const PDF_MIME_TYPE = "application/pdf";

export async function createPdfArtifact(
  context: ExportContext,
  fileName: string,
  artifactRef: string,
): Promise<{ format: "pdf"; fileName: string; mimeType: string; data: Blob; artifactRef: string }> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const rows = buildExportRows(context);
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
  write(`Jurisdiction: ${context.metadata.jurisdiction} (${context.metadata.jurisdictionCode})`, 11, true);
  write("Selected authority: Not specified by the registry; confirm the current instructions with the relevant Nigerian tax authority.");
  write(`Tax year: ${context.metadata.taxYear}`);
  write(`Calculation: ${context.metadata.calculationLabel}`);
  write(`Readiness: ${context.metadata.readiness}`);
  write(`Rule profile: ${context.metadata.ruleProfileId} ${context.metadata.ruleProfileVersion}`);
  write(`Rule source: ${context.metadata.source || "Not configured"}`);
  write(`Rule source verified at: ${context.metadata.sourceVerifiedAt || "Not verified"}`);
  write(`Deadline source: ${context.metadata.deadlineSource || "Not verified"}`);
  write(`Deadline verified at: ${context.metadata.deadlineVerifiedAt || "Not verified"}`);
  write("Filing checklist", 12, true);
  write("[ ] Review the calculation, assumptions, missing items, and document index.");
  write("[ ] Confirm current authority requirements and add any required forms or documents.");
  write("[ ] Submit manually through the relevant authority channel, if eligible.");
  write("Status: Not submitted. FileSmart has not filed this preparation or received authority confirmation.");

  const missing = context.preparation.calculationProvenance.missingInputWarnings;
  write("Missing or unresolved items", 12, true);
  if (missing.length === 0) write("None recorded in the preparation.");
  for (const item of missing) write(`- ${item}`);

  write("Supporting documents", 12, true);
  const documents = rows.filter((row) => row.section === "document_index");
  if (documents.length === 0) write("No document references recorded.");
  for (const document of documents) {
    write(`${document.label} — ${document.status} — ${document.reference || "no reference"}`);
  }

  write("Assumptions", 12, true);
  for (const assumption of context.preparation.calculationProvenance.assumptions) write(`- ${assumption}`);

  const output = doc.output("arraybuffer");
  return { format: "pdf", fileName, mimeType: PDF_MIME_TYPE, data: new Blob([output], { type: PDF_MIME_TYPE }), artifactRef };
}

export const exportPdf = createPdfArtifact;
