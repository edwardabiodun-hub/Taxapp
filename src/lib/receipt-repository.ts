import { db, type ReceiptRecord } from "@/lib/local-db";

const receiptFields = new Set([
  "id",
  "preparationId",
  "assetRef",
  "fileName",
  "mimeType",
  "size",
  "status",
  "extractedData",
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
    !isNonEmptyString(value.assetRef) ||
    !isNonEmptyString(value.fileName) ||
    !isNonEmptyString(value.mimeType) ||
    typeof value.size !== "number" ||
    !Number.isInteger(value.size) ||
    value.size < 0 ||
    !["needs_review", "confirmed", "rejected"].includes(String(value.status)) ||
    !isNonEmptyString(value.createdAt) ||
    !isNonEmptyString(value.updatedAt)
  ) {
    return false;
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

export async function saveReceiptRecord(receipt: ReceiptRecord): Promise<void> {
  if (!isReceiptRecordPersistable(receipt)) {
    throw new Error("Receipt records may contain metadata and asset references only.");
  }
  await db.receiptRecords.put(receipt);
}

export async function getReceiptRecord(id: string): Promise<ReceiptRecord | undefined> {
  return db.receiptRecords.get(id);
}

export async function listReceiptRecords(preparationId: string): Promise<ReceiptRecord[]> {
  return db.receiptRecords.where("preparationId").equals(preparationId).toArray();
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
