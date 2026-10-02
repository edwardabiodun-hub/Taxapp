import type { DeclarationIncomeFields } from "@/types/declaration";
import { isConfirmedReceiptRecord, type ReceiptRecord } from "@/domain/receipts";
import type { ExportContext, ExportMetadata } from "@/domain/exports";

export const EXPORT_HEADERS = ["schema_version", "section", "field", "label", "value", "source", "reference", "category", "date", "amount", "status"] as const;
export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string>;

export const SAFE_PREPARATION_FIELDS = [
  "businessIncome", "businessExpenses", "annualSalary", "commissions", "bonuses", "allowances",
  "pensionReceived", "pensionPayerName", "pensionPayerAddress", "annuityInsurance", "annuityPayerName",
  "annuityPayerAddress", "gratuities", "gratuityPayerName", "gratuityPayerAddress", "foreignIncome",
  "nigerianDividends", "otherDividends", "interestIncome", "interestSources", "rentIncome", "rentExpenses",
  "otherInvestmentIncome", "otherInvestmentDetails", "rentPaidBySelf", "rentPaidBySelfAddress",
  "rentPaidByEmployer", "rentPaidByEmployerName", "domesticStaffBySelf", "domesticStaffByEmployer",
  "companyVehicleCost", "companyVehicleDetails", "employeePension", "annualRentPaid",
] as const satisfies readonly (keyof DeclarationIncomeFields)[];

const UNSAFE_TEXT = /(?:data:|blob:|base64|bearer|authorization|api[_ -]?key|credential|password|secret|token|raw(?:[-_\s](?:image|file|bytes|payload|receipt))?)/i;
const UNSAFE_REFERENCE = /(?:data:|blob:|base64|bearer|authorization|api[_ -]?key|credential|password|secret|token|raw)/i;
const SAFE_REFERENCE = /^[A-Za-z0-9][A-Za-z0-9._:/#-]*$/;

export interface SanitizedExportModel { readonly metadata: ExportMetadata; readonly rows: readonly ExportRow[]; readonly unsafeReceiptReferenceCount: number; }

export function buildSanitizedExportModel(context: ExportContext): SanitizedExportModel {
  const metadata = sanitizeExportMetadata(context.metadata);
  const rows: ExportRow[] = [];
  let unsafeReceiptReferenceCount = 0;
  const add = (row: Partial<ExportRow>) => rows.push({
    schema_version: metadata.schemaVersion ?? "", section: "", field: "", label: "", value: "", source: "",
    reference: "", category: "", date: "", amount: "", status: "", ...row,
  });
  const summary = [
    ["preparation_id", "Preparation ID", metadata.preparationId], ["jurisdiction", "Jurisdiction", metadata.jurisdiction],
    ["jurisdiction_code", "Jurisdiction code", metadata.jurisdictionCode], ["tax_year", "Tax year", metadata.taxYear],
    ["registry_version", "Registry version", metadata.registryVersion], ["rule_profile_id", "Rule profile", metadata.ruleProfileId],
    ["rule_profile_version", "Rule profile version", metadata.ruleProfileVersion], ["calculation_label", "Calculation", metadata.calculationLabel],
    ["readiness", "Readiness", metadata.readiness], ["rule_source", "Rule source", metadata.source],
    ["rule_verified_at", "Rule verified at", metadata.sourceVerifiedAt], ["deadline_source", "Deadline source", metadata.deadlineSource],
    ["deadline_verified_at", "Deadline verified at", metadata.deadlineVerifiedAt], ["generated_at", "Generated at", metadata.generatedAt],
    ["not_submitted", "Submission status", "Not submitted"],
  ] as const;
  for (const [field, label, value] of summary) add({ section: "summary", field, label, value: safeValue(value), source: "FileSmart export metadata" });

  for (const field of SAFE_PREPARATION_FIELDS) {
    const value = safeScalarValue(context.preparation.formData[field]);
    if (value !== undefined) add({ section: "income_deductions", field, label: humanize(field), value, source: "Preparation form" });
  }
  for (const [index, value] of context.preparation.calculationProvenance.assumptions.entries()) {
    const safe = safeScalarValue(value);
    if (safe !== undefined) add({ section: "assumptions", field: `assumption_${index + 1}`, label: "Calculation assumption", value: safe, source: metadata.ruleProfileId });
  }
  for (const [index, value] of context.preparation.calculationProvenance.missingInputWarnings.entries()) {
    const safe = safeScalarValue(value);
    if (safe !== undefined) add({ section: "unresolved_items", field: `missing_item_${index + 1}`, label: "Missing or unresolved item", value: safe, source: "Preparation review", status: "unresolved" });
  }
  const documents = Array.isArray(context.preparation.formData.documents) ? context.preparation.formData.documents : [];
  for (const value of documents) {
    const document = sanitizeDocument(value);
    if (document) add({ section: "document_index", field: "preparation_document", label: document.name, value: "Reference only", reference: document.id, category: document.category, status: "attached" });
  }
  for (const receipt of context.receipts.filter(isConfirmedReceiptRecord)) {
    if (!isOpaqueAssetReferenceForExport(receipt.assetRef)) { unsafeReceiptReferenceCount += 1; continue; }
    add({ section: "document_index", field: "confirmed_receipt", label: safeValue(receipt.fileName), value: safeValue(receipt.fields.vendor.value), reference: receipt.assetRef, category: safeValue(receipt.fields.category.value), date: safeValue(receipt.fields.date.value), amount: safeValue(receipt.fields.amount.value), status: "confirmed" });
  }
  if (unsafeReceiptReferenceCount > 0) add({ section: "document_index", field: "unsafe_receipt_reference", label: "Confirmed receipt reference", value: "Omitted unsafe receipt reference", source: "Export security validation", status: "omitted" });
  const note = safeScalarValue(context.capability.notes);
  if (note) add({ section: "summary", field: "capability_note", label: "Capability note", value: note, source: "Jurisdiction registry" });
  return { metadata, rows, unsafeReceiptReferenceCount };
}

export function buildExportRows(context: ExportContext): readonly ExportRow[] { return buildSanitizedExportModel(context).rows; }

export function sanitizeExportMetadata(metadata: ExportMetadata): ExportMetadata {
  return { ...metadata, schemaVersion: metadata.schemaVersion ?? "1.0.0", preparationId: safeValue(metadata.preparationId), jurisdiction: safeValue(metadata.jurisdiction), jurisdictionCode: safeValue(metadata.jurisdictionCode), taxYear: safeValue(metadata.taxYear), registryVersion: safeValue(metadata.registryVersion), ruleProfileId: safeValue(metadata.ruleProfileId), ruleProfileVersion: safeValue(metadata.ruleProfileVersion), calculationLabel: safeValue(metadata.calculationLabel) as ExportMetadata["calculationLabel"], readiness: safeValue(metadata.readiness) as ExportMetadata["readiness"], source: safeValue(metadata.source), sourceVerifiedAt: safeValue(metadata.sourceVerifiedAt), deadlineSource: safeValue(metadata.deadlineSource), deadlineVerifiedAt: safeValue(metadata.deadlineVerifiedAt), generatedAt: safeValue(metadata.generatedAt), notSubmitted: true };
}

export function safeScalarValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : undefined;
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string" || value.length > 500 || /[\u0000-\u001f\u007f]/.test(value) || UNSAFE_TEXT.test(value)) return undefined;
  return value;
}
export function safeValue(value: unknown): string { return safeScalarValue(value) ?? ""; }

export function isOpaqueAssetReferenceForExport(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const reference = value.trim();
  return reference.length > 0 && reference.length <= 300 && !/[\u0000-\u001f\u007f]/.test(reference) && !UNSAFE_REFERENCE.test(reference) && !/^base64(?:[:,])/i.test(reference) && !/^[A-Za-z0-9+/]{20,}={0,2}$/.test(reference) && SAFE_REFERENCE.test(reference) && /[/:#]/.test(reference);
}

function sanitizeDocument(value: unknown): { id: string; name: string; category: string } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  const id = safeScalarValue(item.id); const name = safeScalarValue(item.name); const category = safeScalarValue(item.category); const type = safeScalarValue(item.type);
  return id !== undefined && name !== undefined && category !== undefined && type !== undefined && typeof item.size === "number" && Number.isFinite(item.size) && item.size >= 0 ? { id, name, category } : undefined;
}
function humanize(value: string): string { return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function isConfirmedReceiptForExport(receipt: ReceiptRecord): boolean { return isConfirmedReceiptRecord(receipt) && isOpaqueAssetReferenceForExport(receipt.assetRef); }
