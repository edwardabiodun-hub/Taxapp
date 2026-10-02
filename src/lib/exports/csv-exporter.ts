import type { ExportContext } from "@/domain/exports";
import { EXPORT_HEADERS, buildExportRows, safeValue } from "@/lib/exports/export-data";

export const CSV_MIME_TYPE = "text/csv;charset=utf-8";

export async function createCsvArtifact(
  context: ExportContext,
  fileName: string,
  artifactRef: string,
): Promise<{ format: "csv"; fileName: string; mimeType: string; data: Blob; artifactRef: string }> {
  const rows = buildExportRows(context);
  const header = EXPORT_HEADERS.map(csvEscape).join(",");
  const body = rows.map((row) => EXPORT_HEADERS.map((key) => csvEscape(row[key])).join(","));
  const csv = `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
  return { format: "csv", fileName, mimeType: CSV_MIME_TYPE, data: new Blob([csv], { type: CSV_MIME_TYPE }), artifactRef };
}

export function csvEscape(value: unknown): string {
  let text = safeValue(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const exportCsv = createCsvArtifact;
