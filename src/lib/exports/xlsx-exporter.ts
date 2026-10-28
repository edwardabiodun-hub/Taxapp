import { EXPORT_SCHEMA_VERSION, type ExportContext } from "@/domain/exports";
import { EXPORT_HEADERS, buildSanitizedExportModel, type ExportRow } from "@/lib/exports/export-data";

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function createXlsxArtifact(
  context: ExportContext,
  fileName: string,
  artifactRef: string,
): Promise<{ format: "xlsx"; fileName: string; mimeType: string; data: Blob; artifactRef: string }> {
  const model = buildSanitizedExportModel(context);
  const rows = model.rows;
  const summaryRows = [
    ["FileSmart export", "Not submitted"],
    ["Schema version", EXPORT_SCHEMA_VERSION],
    ...rows.filter((row) => row.section === "summary").map((row) => [row.label, row.value]),
    ["Submission status", "Not submitted"],
  ];
  const tabularRows = [EXPORT_HEADERS as readonly string[], ...rowsToValues(rows.filter((row) => row.section === "income_deductions"))];
  const assumptionRows = [EXPORT_HEADERS as readonly string[], ...rowsToValues(rows.filter((row) => row.section === "assumptions"))];
  const documentRows = [EXPORT_HEADERS as readonly string[], ...rowsToValues(rows.filter((row) => row.section === "document_index"))];
  const entries = [
    ["[Content_Types].xml", contentTypesXml(4)],
    ["_rels/.rels", rootRelationshipsXml()],
    ["xl/workbook.xml", workbookXml()],
    ["xl/_rels/workbook.xml.rels", workbookRelationshipsXml(4)],
    ["xl/worksheets/sheet1.xml", worksheetXml(summaryRows)],
    ["xl/worksheets/sheet2.xml", worksheetXml(tabularRows)],
    ["xl/worksheets/sheet3.xml", worksheetXml(assumptionRows)],
    ["xl/worksheets/sheet4.xml", worksheetXml(documentRows)],
  ] as const;
  const bytes = createStoredZip(entries);
  return { format: "xlsx", fileName, mimeType: XLSX_MIME_TYPE, data: new Blob([bytes], { type: XLSX_MIME_TYPE }), artifactRef };
}

function rowsToValues(rows: readonly ExportRow[]): readonly (readonly string[])[] {
  return rows.map((row) => EXPORT_HEADERS.map((header) => row[header]));
}

function worksheetXml(rows: readonly (readonly (string | undefined)[])[]): string {
  const columnCount = rows.reduce((maximum, row) => Math.max(maximum, row.length), 0);
  const lastColumn = columnName(Math.max(columnCount, 1));
  const rowXml = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(value ?? "", columnIndex, rowIndex)).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${Math.max(rows.length, 1)}"/><sheetData>${rowXml}</sheetData></worksheet>`;
}

function cellXml(value: string, columnIndex: number, rowIndex: number): string {
  return `<c r="${columnName(columnIndex + 1)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function workbookXml(): string {
  const sheets = ["Summary", "Income & Deductions", "Assumptions", "Document Index"].map((name, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets}</sheets></workbook>`;
}

function contentTypesXml(sheetCount: number): string {
  const sheets = Array.from({ length: sheetCount }, (_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets}</Types>`;
}

function rootRelationshipsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
}

function workbookRelationshipsXml(sheetCount: number): string {
  const relationships = Array.from({ length: sheetCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}</Relationships>`;
}

function columnName(columnNumber: number): string {
  let value = columnNumber;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

type ZipEntry = readonly [name: string, content: string];

function createStoredZip(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [name, content] of entries) {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    const checksum = crc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + contentBytes.length;
  }

  const localDirectory = concatBytes(localParts);
  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectory.length, true);
  endView.setUint32(16, localDirectory.length, true);
  return concatBytes([localDirectory, centralDirectory, end]);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function crc32(bytes: Uint8Array): number {
  let checksum = 0xffffffff;
  for (const byte of bytes) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit += 1) checksum = (checksum >>> 1) ^ (0xedb88320 & -(checksum & 1));
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

export const exportXlsx = createXlsxArtifact;
