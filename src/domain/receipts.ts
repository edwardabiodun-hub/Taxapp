export const RECEIPT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const RECEIPT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const RECEIPT_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "CAD", "AUD", "ZAR", "GHS", "KES"] as const;
export const RECEIPT_CATEGORIES = ["meals", "transport", "office", "utilities", "accommodation", "professional_services", "other"] as const;

export type ReceiptCurrency = (typeof RECEIPT_CURRENCIES)[number];
export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];
export type ReceiptReviewStatus = "captured" | "processing" | "needs_review" | "confirmed" | "rejected";
export type ReceiptFieldName = "vendor" | "date" | "amount" | "taxAmount" | "currency" | "category";

export interface ReceiptAsset {
  readonly preparationId: string;
  readonly assetRef: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly file?: Blob;
}

export interface ReceiptField<T = string> {
  readonly value: T | null;
  readonly confidence: number | null;
  readonly source: "ocr" | "user";
  readonly userConfirmed: boolean;
}

export type ReceiptFields = {
  readonly vendor: ReceiptField<string>;
  readonly date: ReceiptField<string>;
  readonly amount: ReceiptField<string>;
  readonly taxAmount: ReceiptField<string>;
  readonly currency: ReceiptField<ReceiptCurrency>;
  readonly category: ReceiptField<ReceiptCategory>;
};

export interface ReceiptContractMetadata {
  readonly providerCategory?: string;
  readonly retentionPeriod?: string;
  readonly noTraining?: boolean;
}

export interface ReceiptProvenance {
  readonly provider: string;
  readonly model: string;
  readonly version: string;
  readonly contract?: ReceiptContractMetadata;
}

export interface ReceiptCorrection {
  readonly field: ReceiptFieldName;
  readonly previousValue: string | null;
  readonly correctedValue: string | null;
  readonly at: string;
}

export interface ConfirmedReceiptInput {
  readonly receiptId: string;
  readonly vendor: string | null;
  readonly date: string | null;
  readonly amount: string | null;
  readonly taxAmount: string | null;
  readonly currency: ReceiptCurrency | null;
  readonly category: ReceiptCategory | null;
}

export interface ReceiptRecord {
  readonly id: string;
  readonly preparationId: string;
  readonly assetRef: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly reviewStatus: ReceiptReviewStatus;
  readonly fields: ReceiptFields;
  readonly originalFields?: ReceiptFields;
  readonly correctionHistory?: readonly ReceiptCorrection[];
  readonly provenance?: ReceiptProvenance;
  readonly calculationInput?: ConfirmedReceiptInput;
  readonly errorMessage?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly confirmedAt?: string;
}

export type ReceiptCorrections = Partial<Record<ReceiptFieldName, string | null>>;

const FIELD_NAMES: readonly ReceiptFieldName[] = ["vendor", "date", "amount", "taxAmount", "currency", "category"];
const SAFE_PROVENANCE_VALUE = /^(?!.*(?:data:|blob:|base64|bearer|authorization|api[_-]?key|secret|token))[\x20-\x7e]{1,160}$/i;
const RECEIPT_FIELD_KEYS = ["value", "confidence", "source", "userConfirmed"] as const;
const PROVENANCE_KEYS = ["provider", "model", "version", "contract"] as const;
const CONTRACT_KEYS = ["providerCategory", "retentionPeriod", "noTraining"] as const;
const CORRECTION_KEYS = ["field", "previousValue", "correctedValue", "at"] as const;
const CALCULATION_INPUT_KEYS = ["receiptId", ...FIELD_NAMES] as const;

export function getCalculationReceiptInputs(records: readonly ReceiptRecord[]): ConfirmedReceiptInput[] {
  return records.flatMap((record) => {
    const derived = deriveConfirmedReceiptInput(record);
    return derived && inputsEqual(record.calculationInput, derived) ? [derived] : [];
  });
}

export function deriveConfirmedReceiptInput(record: ReceiptRecord): ConfirmedReceiptInput | undefined {
  if (!isConfirmedReceiptRecord(record)) return undefined;
  return {
    receiptId: record.id,
    vendor: record.fields.vendor.value,
    date: record.fields.date.value,
    amount: record.fields.amount.value,
    taxAmount: record.fields.taxAmount.value,
    currency: record.fields.currency.value,
    category: record.fields.category.value,
  };
}

export function isConfirmedReceiptRecord(record: ReceiptRecord): boolean {
  return record.reviewStatus === "confirmed" &&
    typeof record.confirmedAt === "string" && record.confirmedAt.trim().length > 0 &&
    isReceiptFieldsValid(record.fields) && FIELD_NAMES.every((name) => record.fields[name].userConfirmed) &&
    (!record.originalFields || isReceiptFieldsValid(record.originalFields)) &&
    isReceiptProvenanceSafe(record.provenance) &&
    isReceiptCorrectionHistorySafe(record.correctionHistory) &&
    isConfirmedReceiptInputValid(record.calculationInput);
}

export function isReceiptProvenanceSafe(provenance: unknown): provenance is ReceiptProvenance {
  if (provenance === undefined) return true;
  if (!isPlainObject(provenance) || !hasExactKeys(provenance, PROVENANCE_KEYS) ||
      !isSafeRequiredText(provenance.provider) || !isSafeRequiredText(provenance.model) ||
      !isSafeRequiredText(provenance.version)) return false;
  if (provenance.contract === undefined) return true;
  if (!isPlainObject(provenance.contract) || !hasExactKeys(provenance.contract, CONTRACT_KEYS)) return false;
  const contract = provenance.contract;
  return (contract.providerCategory === undefined || isSafeOptionalText(contract.providerCategory)) &&
    (contract.retentionPeriod === undefined || isSafeOptionalText(contract.retentionPeriod)) &&
    (contract.noTraining === undefined || typeof contract.noTraining === "boolean");
}

export function isConfirmedReceiptInputValid(value: unknown): value is ConfirmedReceiptInput {
  if (!isPlainObject(value) || !hasExactKeys(value, CALCULATION_INPUT_KEYS) ||
      !isSafeRequiredText(value.receiptId)) return false;
  return FIELD_NAMES.every((name) => isValidReceiptFieldValue(name, value[name]));
}

export function isAllowedReceiptCurrency(value: unknown): value is ReceiptCurrency {
  return typeof value === "string" && RECEIPT_CURRENCIES.includes(value as ReceiptCurrency);
}

export function isAllowedReceiptCategory(value: unknown): value is ReceiptCategory {
  return typeof value === "string" && RECEIPT_CATEGORIES.includes(value as ReceiptCategory);
}

export function isValidReceiptFieldValue(name: ReceiptFieldName, value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 200) return false;
  if (name === "currency") return isAllowedReceiptCurrency(value);
  if (name === "category") return isAllowedReceiptCategory(value);
  if (name === "date") {
    const parsed = Date.parse(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed) && new Date(parsed).toISOString().startsWith(value);
  }
  if (name === "amount" || name === "taxAmount") {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1_000_000_000_000;
  }
  return value.trim().length > 0;
}

export function isReceiptFieldsValid(fields: ReceiptFields): boolean {
  if (!isPlainObject(fields) || !hasExactKeys(fields, FIELD_NAMES)) return false;
  const valid = FIELD_NAMES.every((name) => {
    const field = fields[name];
    return isReceiptFieldObject(field) && isValidReceiptFieldValue(name, field.value) &&
      (field.confidence === null || (typeof field.confidence === "number" && Number.isFinite(field.confidence) && field.confidence >= 0 && field.confidence <= 1));
  });
  return valid && (!fields.amount.value || !fields.taxAmount.value || Number(fields.taxAmount.value) <= Number(fields.amount.value));
}

function isReceiptFieldObject(value: unknown): value is ReceiptField {
  return isPlainObject(value) && hasExactKeys(value, RECEIPT_FIELD_KEYS) &&
    (value.source === "ocr" || value.source === "user") &&
    typeof value.userConfirmed === "boolean" && (value.value === null || typeof value.value === "string") &&
    (value.confidence === null || typeof value.confidence === "number");
}

export function isReceiptCorrectionHistorySafe(history: unknown): history is readonly ReceiptCorrection[] {
  return history === undefined || (Array.isArray(history) && history.every((entry) =>
    isPlainObject(entry) && hasExactKeys(entry, CORRECTION_KEYS) && FIELD_NAMES.includes(entry.field as ReceiptFieldName) &&
    (entry.previousValue === null || typeof entry.previousValue === "string") &&
    (entry.correctedValue === null || typeof entry.correctedValue === "string") &&
    typeof entry.at === "string" && entry.at.trim().length > 0));
}

function inputsEqual(left: ConfirmedReceiptInput | undefined, right: ConfirmedReceiptInput): boolean {
  return !!left && FIELD_NAMES.every((name) => left[name] === right[name]) && left.receiptId === right.receiptId;
}

function isSafeOptionalText(value: unknown): boolean {
  return value === undefined || (typeof value === "string" && SAFE_PROVENANCE_VALUE.test(value));
}

function isSafeRequiredText(value: unknown): value is string {
  return typeof value === "string" && SAFE_PROVENANCE_VALUE.test(value);
}

function hasExactKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).length === allowed.length && allowed.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
