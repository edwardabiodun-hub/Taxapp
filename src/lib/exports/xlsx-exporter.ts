import { EXPORT_SCHEMA_VERSION, type ExportContext } from "@/domain/exports";
import { EXPORT_HEADERS, buildExportRows } from "@/lib/exports/export-data";

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function createXlsxArtifact(
  context: ExportContext,
  fileName: string,
  artifactRef: string,
): Promise<{ format: "xlsx"; fileName: string; mimeType: string; data: Blob; artifactRef: string }> {
  const XLSX = await import("xlsx");
  const rows = buildExportRows(context);
  const workbook = XLSX.utils.book_new();
  const summaryRows = [
    ["FileSmart export", "Not submitted"],
    ["Schema version", EXPORT_SCHEMA_VERSION],
    ["Jurisdiction", context.metadata.jurisdiction],
    ["Jurisdiction code", context.metadata.jurisdictionCode],
    ["Tax year", context.metadata.taxYear],
    ["Calculation", context.metadata.calculationLabel],
    ["Readiness", context.metadata.readiness],
    ["Rule profile", context.metadata.ruleProfileId],
    ["Rule profile version", context.metadata.ruleProfileVersion],
    ["Rule source", context.metadata.source],
    ["Rule verified at", context.metadata.sourceVerifiedAt],
    ["Deadline source", context.metadata.deadlineSource],
    ["Deadline verified at", context.metadata.deadlineVerifiedAt],
    ["Generated at", context.metadata.generatedAt],
    ["Submission status", "Not submitted"],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(XLSX, rows.filter((row) => row.section === "income_deductions")), "Income & Deductions");
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(XLSX, rows.filter((row) => row.section === "assumptions")), "Assumptions");
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(XLSX, rows.filter((row) => row.section === "document_index")), "Document Index");
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array", compression: true });
  return { format: "xlsx", fileName, mimeType: XLSX_MIME_TYPE, data: new Blob([bytes], { type: XLSX_MIME_TYPE }), artifactRef };
}

function rowsToSheet(XLSX: typeof import("xlsx"), rows: readonly Record<string, string>[]) {
  const values = rows.map((row) => [
    row.schema_version,
    row.section,
    row.field,
    row.label,
    row.value,
    row.source,
    row.reference,
    row.category,
    row.date,
    row.amount,
    row.status,
  ]);
  return XLSX.utils.aoa_to_sheet([["schema_version", "section", "field", "label", "value", "source", "reference", "category", "date", "amount", "status"], ...values]);
}

export const exportXlsx = createXlsxArtifact;
