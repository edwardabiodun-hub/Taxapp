import {
  deriveConfirmedReceiptInput,
  isConfirmedReceiptInputValid,
  isReceiptFieldsValid,
  isReceiptCorrectionHistorySafe,
  isReceiptProvenanceSafe,
  isConfirmedReceiptRecord,
  isSafeReceiptText,
  type ReceiptCorrections,
  type ReceiptFieldName,
  type ReceiptRecord as DomainReceiptRecord,
  type ReceiptFields,
} from "@/domain/receipts";
import { db, type ReceiptRecord } from "@/lib/local-db";

const receiptFields = new Set([
  "id",
  "preparationId",
  "assetRef",
  "fileName",
  "mimeType",
  "size",
  "status",
  "reviewStatus",
  "extractedData",
  "fields",
  "originalFields",
  "correctionHistory",
  "provenance",
  "calculationInput",
  "errorMessage",
  "confirmedAt",
  "createdAt",
  "updatedAt",
]);
const extractedFields = new Set([
  "vendorName",
  "receiptNumber",
  "receiptDate",
  "currency",
  "subtotal",
  "taxAmount",
  "totalAmount",
]);
const RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const EXECUTABLE_EXTENSIONS = /\.(?:php|php[0-9]?|jsp|jspx|exe|sh|bash|bat|cmd|com|msi|dll|scr|ps1|vbs|js|mjs|cjs)$/i;

export function isReceiptRecordPersistable(value: unknown): value is ReceiptRecord {
  if (!isPlainObject(value) || !hasOnlyKeys(value, receiptFields)) return false;

  if (
    !isSafeNonEmptyString(value.id) ||
    !isSafeNonEmptyString(value.preparationId) ||
    !isOpaqueAssetReference(value.assetRef) ||
    !isSafeNonEmptyString(value.fileName) ||
    !isSafeNonEmptyString(value.mimeType) ||
    EXECUTABLE_EXTENSIONS.test(value.fileName) ||
    !RECEIPT_MIME_TYPES.has(value.mimeType.toLowerCase()) ||
    typeof value.size !== "number" ||
    !Number.isInteger(value.size) ||
    value.size < 0 ||
    (value.size > 10 * 1024 * 1024) ||
    (!isNewReceiptRecord(value) && !isLegacyStatus(value.status)) ||
    (isNewReceiptRecord(value) && value.status !== undefined && !isLegacyStatus(value.status)) ||
    !isSafeNonEmptyString(value.createdAt) ||
    !isSafeNonEmptyString(value.updatedAt) ||
    (value.errorMessage !== undefined && !isSafeReceiptText(value.errorMessage)) ||
    (value.confirmedAt !== undefined && !isSafeNonEmptyString(value.confirmedAt)) ||
    !isReceiptProvenanceSafe(value.provenance) ||
    (value.originalFields !== undefined && !isNewReceiptFieldsPersistable(value.originalFields)) ||
    !isReceiptCorrectionHistorySafe(value.correctionHistory) ||
    (value.calculationInput !== undefined && !isCalculationInputPersistable(value.calculationInput))
  ) {
    return false;
  }

  if (isNewReceiptRecord(value)) {
    const statusValid = ["captured", "processing", "needs_review", "confirmed", "rejected"].includes(
      String(value.reviewStatus),
    );
    if (!statusValid || !isNewReceiptFieldsPersistable(value.fields)) return false;
    if (value.reviewStatus === "confirmed") {
      const record = value as unknown as DomainReceiptRecord;
      return isConfirmedReceiptRecord(record) && isCalculationInputPersistable(value.calculationInput) &&
        JSON.stringify(value.calculationInput) === JSON.stringify(deriveConfirmedReceiptInput(record));
    }
    return value.calculationInput === undefined;
  }

  return isLegacyExtractedDataPersistable(value.extractedData);
}

export async function saveReceiptRecord(
  receipt: ReceiptRecord | DomainReceiptRecord,
): Promise<void> {
  if (isConfirmationManagedRecord(receipt)) {
    throw new Error("Receipt confirmation records may only be persisted by confirmReceipt.");
  }
  await persistReceiptRecord(receipt);
}

export interface ReceiptRepositoryBoundary {
  readonly getRecord?: (id: string) => Promise<DomainReceiptRecord | undefined>;
}

export interface ConfirmReceiptOptions extends ReceiptRepositoryBoundary { readonly now?: () => string; }

export async function confirmReceipt(
  id: string,
  corrections: ReceiptCorrections = {},
  options: ConfirmReceiptOptions = {},
): Promise<DomainReceiptRecord> {
  const record = await (options.getRecord ?? getReceiptRecord)(id);
  if (!record) throw new Error("Receipt record is unavailable for confirmation.");
  const now = options.now ?? (() => new Date().toISOString());
  const confirmed = buildConfirmedReceipt(id, record, corrections, now());
  await saveConfirmedReceiptRecord(confirmed);
  return confirmed;
}

async function saveConfirmedReceiptRecord(receipt: DomainReceiptRecord): Promise<void> {
  await persistReceiptRecord(receipt);
}

async function persistReceiptRecord(receipt: ReceiptRecord | DomainReceiptRecord): Promise<void> {
  if (!isReceiptRecordPersistable(receipt)) {
    throw new Error("Receipt records may contain metadata and asset references only.");
  }
  await db.receiptRecords.put(receipt as ReceiptRecord);
}

export async function getReceiptRecord(
  id: string,
): Promise<DomainReceiptRecord | undefined> {
  const value = await db.receiptRecords.get(id);
  return value && isReceiptRecordPersistable(value as unknown as Record<string, unknown>) && isNewReceiptRecord(value as unknown as Record<string, unknown>)
    ? value as unknown as DomainReceiptRecord
    : undefined;
}

export async function listReceiptRecords(
  preparationId: string,
): Promise<DomainReceiptRecord[]> {
  const values = await db.receiptRecords.where("preparationId").equals(preparationId).toArray();
  return values.filter((value) => isReceiptRecordPersistable(value as unknown as Record<string, unknown>) && isNewReceiptRecord(value as unknown as Record<string, unknown>)) as unknown as DomainReceiptRecord[];
}

function isNewReceiptRecord(
  value: Record<string, unknown>,
): value is Record<string, unknown> & Pick<DomainReceiptRecord, "reviewStatus" | "fields"> {
  return "reviewStatus" in value || "fields" in value;
}

function isConfirmationManagedRecord(value: ReceiptRecord | DomainReceiptRecord): boolean {
  const candidate = value as unknown as Record<string, unknown>;
  return candidate.reviewStatus === "confirmed" || candidate.status === "confirmed" || candidate.calculationInput !== undefined;
}

function isNewReceiptFieldsPersistable(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  const allowedFields = ["vendor", "date", "amount", "taxAmount", "currency", "category"];
  if (!Object.keys(value).every((name) => allowedFields.includes(name))) return false;
  if (!allowedFields.every((name) => {
    const field = value[name];
    return isPlainObject(field) &&
      typeof field.userConfirmed === "boolean" &&
      (field.source === "ocr" || field.source === "user") &&
      (field.value === null || typeof field.value === "string") &&
      (field.confidence === null ||
        (typeof field.confidence === "number" &&
          Number.isFinite(field.confidence) &&
          field.confidence >= 0 &&
        field.confidence <= 1));
  })) return false;
  return isReceiptFieldsValid(value as ReceiptFields);
}

function isCalculationInputPersistable(value: unknown): boolean {
  return isConfirmedReceiptInputValid(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isSafeNonEmptyString(value: unknown): value is string {
  return isSafeReceiptText(value) && value.trim().length > 0;
}

function isLegacyStatus(value: unknown): boolean {
  return ["captured", "processing", "needs_review", "confirmed", "rejected"].includes(String(value));
}

function isLegacyExtractedDataPersistable(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isPlainObject(value) || !hasOnlyKeys(value, extractedFields)) return false;

  return Object.entries(value).every(([key, entry]) => {
    if (["vendorName", "receiptNumber", "receiptDate", "currency"].includes(key)) {
      return isSafeReceiptText(entry) && entry.trim().length > 0;
    }
    return typeof entry === "number" && Number.isFinite(entry) && entry >= 0 && entry <= 1_000_000_000_000;
  });
}

function isOpaqueAssetReference(value: unknown): value is string {
  if (!isSafeNonEmptyString(value)) return false;

  const reference = value.trim();
  if (/^(data|blob):/i.test(reference) || /^base64(?:[:,])/i.test(reference)) {
    return false;
  }

  // A raw Base64 payload has no storage boundary. Accept only references with
  // an explicit opaque-reference delimiter; this rejects padded and unpadded
  // Base64 as well as arbitrary raw strings and inline/blob forms.
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(reference)) return false;

  return /[/:#]/.test(reference);
}

function buildConfirmedReceipt(
  id: string,
  record: DomainReceiptRecord,
  corrections: ReceiptCorrections,
  now: string,
): DomainReceiptRecord {
  if (record.id !== id) throw new Error("Receipt ID does not match the record.");
  if (record.reviewStatus === "rejected") throw new Error("Rejected receipts cannot be confirmed.");
  const fields = { ...record.fields } as Record<ReceiptFieldName, ReceiptFields[ReceiptFieldName]>;
  const history = [...(record.correctionHistory ?? [])];
  for (const [name, value] of Object.entries(corrections) as [ReceiptFieldName, string | null][]) {
    if (!isCorrectionAllowed(name, value)) throw new Error(`Invalid receipt ${name} value.`);
    const previousValue = fields[name].value;
    const nextValue = value === null || value === "" ? null : value;
    if (previousValue !== nextValue) history.push({ field: name, previousValue, correctedValue: nextValue, at: now });
    fields[name] = { ...fields[name], value: nextValue, source: "user", userConfirmed: true } as ReceiptFields[ReceiptFieldName];
  }
  const confirmedFields = Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, { ...field, userConfirmed: true }])) as ReceiptFields;
  if (!isReceiptFieldsValid(confirmedFields)) throw new Error("Receipt fields are invalid or inconsistent.");
  return {
    ...record,
    originalFields: record.originalFields ?? record.fields,
    correctionHistory: history,
    fields: confirmedFields,
    reviewStatus: "confirmed",
    calculationInput: {
      receiptId: id,
      vendor: confirmedFields.vendor.value,
      date: confirmedFields.date.value,
      amount: confirmedFields.amount.value,
      taxAmount: confirmedFields.taxAmount.value,
      currency: confirmedFields.currency.value,
      category: confirmedFields.category.value,
    },
    confirmedAt: now,
    updatedAt: now,
    errorMessage: undefined,
  };
}

function isCorrectionAllowed(name: ReceiptFieldName, value: string | null): boolean {
  if (value === null || value === "") return true;
  const field = {
    ...emptyFields(),
    [name]: { value, confidence: null, source: "user" as const, userConfirmed: true },
  } as ReceiptFields;
  return isReceiptFieldsValid(field);
}

function emptyFields(): ReceiptFields {
  const empty = { value: null, confidence: null, source: "ocr" as const, userConfirmed: false };
  return { vendor: empty, date: empty, amount: empty, taxAmount: empty, currency: empty, category: empty } as ReceiptFields;
}
