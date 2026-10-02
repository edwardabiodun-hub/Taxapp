import {
  isReceiptFieldsValid,
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

export function isReceiptRecordPersistable(value: unknown): value is ReceiptRecord {
  if (!isPlainObject(value) || !hasOnlyKeys(value, receiptFields)) return false;

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.preparationId) ||
    !isOpaqueAssetReference(value.assetRef) ||
    !isNonEmptyString(value.fileName) ||
    !isNonEmptyString(value.mimeType) ||
    typeof value.size !== "number" ||
    !Number.isInteger(value.size) ||
    value.size < 0 ||
    (!isNewReceiptRecord(value) &&
      !["captured", "processing", "needs_review", "confirmed", "rejected"].includes(String(value.status))) ||
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return false;
  }

  if (isNewReceiptRecord(value)) {
    return ["captured", "processing", "needs_review", "confirmed", "rejected"].includes(
      String(value.reviewStatus),
    ) && isNewReceiptFieldsPersistable(value.fields) &&
      (value.calculationInput === undefined || isCalculationInputPersistable(value.calculationInput));
  }

  if (value.extractedData === undefined) return true;
  if (!isPlainObject(value.extractedData) || !hasOnlyKeys(value.extractedData, extractedFields)) {
    return false;
  }

  return Object.entries(value.extractedData).every(([key, entry]) => {
    if (!["vendorName", "receiptNumber", "receiptDate", "currency"].includes(key)) {
      return typeof entry === "number" && Number.isFinite(entry);
    }
    return typeof entry === "string";
  });
}

export async function saveReceiptRecord(
  receipt: ReceiptRecord | DomainReceiptRecord,
): Promise<void> {
  if (!isReceiptRecordPersistable(receipt)) {
    throw new Error("Receipt records may contain metadata and asset references only.");
  }
  await db.receiptRecords.put(receipt as ReceiptRecord);
}

export async function getReceiptRecord(
  id: string,
): Promise<ReceiptRecord | DomainReceiptRecord | undefined> {
  return db.receiptRecords.get(id);
}

export async function listReceiptRecords(
  preparationId: string,
): Promise<Array<ReceiptRecord | DomainReceiptRecord>> {
  return db.receiptRecords.where("preparationId").equals(preparationId).toArray();
}

function isNewReceiptRecord(
  value: Record<string, unknown>,
): value is Record<string, unknown> & Pick<DomainReceiptRecord, "reviewStatus" | "fields"> {
  return "reviewStatus" in value && "fields" in value;
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
  if (!isPlainObject(value)) return false;
  const allowedKeys = ["receiptId", "vendor", "date", "amount", "taxAmount", "currency", "category"];
  return Object.keys(value).every((key) => allowedKeys.includes(key)) &&
    typeof value.receiptId === "string" && value.receiptId.trim().length > 0 &&
    allowedKeys.slice(1).every((key) => value[key] === null || typeof value[key] === "string");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOpaqueAssetReference(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;

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
