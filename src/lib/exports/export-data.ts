import { isConfirmedReceiptRecord, type ReceiptRecord } from "@/domain/receipts";
import { EXPORT_SCHEMA_VERSION, type ExportContext } from "@/domain/exports";

export const EXPORT_HEADERS = [
  "schema_version",
  "section",
  "field",
  "label",
  "value",
  "source",
  "reference",
  "category",
  "date",
  "amount",
  "status",
] as const;

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string>;

const BLOCKED_FIELD = /(?:tax[_ -]?id|access[_ -]?token|api[_ -]?key|password|secret|authorization|raw|bytes|payload)/i;

export function buildExportRows(context: ExportContext): readonly ExportRow[] {
  const { preparation, receipts, capability, metadata } = context;
  const rows: ExportRow[] = [];
  const add = (row: Partial<ExportRow>) => rows.push({
    schema_version: metadataVersion(context),
    section: "",
    field: "",
    label: "",
    value: "",
    source: "",
    reference: "",
    category: "",
    date: "",
    amount: "",
    status: "",
    ...row,
  });

  const summary = [
    ["preparation_id", "Preparation ID", metadata.preparationId],
    ["jurisdiction", "Jurisdiction", metadata.jurisdiction],
    ["jurisdiction_code", "Jurisdiction code", metadata.jurisdictionCode],
    ["tax_year", "Tax year", metadata.taxYear],
    ["registry_version", "Registry version", metadata.registryVersion],
    ["rule_profile_id", "Rule profile", metadata.ruleProfileId],
    ["rule_profile_version", "Rule profile version", metadata.ruleProfileVersion],
    ["calculation_label", "Calculation", metadata.calculationLabel],
    ["readiness", "Readiness", metadata.readiness],
    ["rule_source", "Rule source", metadata.source],
    ["rule_verified_at", "Rule verified at", metadata.sourceVerifiedAt],
    ["deadline_source", "Deadline source", metadata.deadlineSource],
    ["deadline_verified_at", "Deadline verified at", metadata.deadlineVerifiedAt],
    ["generated_at", "Generated at", metadata.generatedAt],
    ["not_submitted", "Submission status", "Not submitted"],
  ] as const;
  for (const [field, label, value] of summary) {
    add({ section: "summary", field, label, value: safeValue(value), source: "FileSmart export metadata" });
  }

  for (const [field, value] of Object.entries(preparation.formData)) {
    if (field === "documents" || BLOCKED_FIELD.test(field)) continue;
    add({
      section: "income_deductions",
      field: safeValue(field),
      label: humanize(field),
      value: safeValue(value),
      source: "Preparation form",
    });
  }

  for (const [index, assumption] of preparation.calculationProvenance.assumptions.entries()) {
    add({
      section: "assumptions",
      field: `assumption_${index + 1}`,
      label: "Calculation assumption",
      value: safeValue(assumption),
      source: metadata.ruleProfileId,
    });
  }

  const documents = Array.isArray(preparation.formData.documents)
    ? preparation.formData.documents
    : [];
  for (const document of documents) {
    add({
      section: "document_index",
      field: "preparation_document",
      label: safeValue(document.name),
      value: "Reference only",
      reference: safeValue(document.id),
      category: safeValue(document.category),
      status: "attached",
    });
  }

  for (const receipt of receipts.filter(isConfirmedReceiptRecord)) {
    add({
      section: "document_index",
      field: "confirmed_receipt",
      label: safeValue(receipt.fileName),
      value: safeValue(receipt.fields.vendor.value),
      reference: safeValue(receipt.assetRef),
      category: safeValue(receipt.fields.category.value),
      date: safeValue(receipt.fields.date.value),
      amount: safeValue(receipt.fields.amount.value),
      status: "confirmed",
    });
  }

  if (capability.notes.trim()) {
    add({ section: "summary", field: "capability_note", label: "Capability note", value: safeValue(capability.notes), source: "Jurisdiction registry" });
  }

  return rows;
}

export function safeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    return Array.from(value)
      .filter((character) => {
        const code = character.charCodeAt(0);
        return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127);
      })
      .join("");
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(safeValue).join(", ");
  return "[omitted complex value]";
}

function metadataVersion(context: ExportContext): string {
  return EXPORT_SCHEMA_VERSION;
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isConfirmedReceiptForExport(receipt: ReceiptRecord): boolean {
  return isConfirmedReceiptRecord(receipt);
}
