import {
  RECEIPT_IMAGE_MIME_TYPES,
  RECEIPT_MAX_FILE_SIZE_BYTES,
  isReceiptFieldsValid,
  type ReceiptAsset,
  type ReceiptFieldName,
  type ReceiptFields,
  type ReceiptRecord,
} from "@/domain/receipts";
import type { OcrExtraction, OcrProvider } from "@/lib/ocr/ocr-provider";
import { confirmReceipt, getReceiptRecord, saveReceiptRecord } from "@/lib/receipt-repository";
import type { ConfirmReceiptOptions } from "@/lib/receipt-repository";
export { confirmReceipt } from "@/lib/receipt-repository";
export type { ConfirmReceiptOptions } from "@/lib/receipt-repository";

const EXECUTABLE_EXTENSIONS = /\.(?:php|php[0-9]?|jsp|jspx|exe|sh|bash|bat|cmd|com|msi|dll|scr|ps1|vbs|js|mjs|cjs)$/i;

export interface ReceiptFileValidation { readonly valid: boolean; readonly reason?: string; }
export interface ReceiptCaptureInput { readonly preparationId: string; readonly file: File; readonly assetRef: string; }
export interface OcrServiceOptions {
  readonly provider?: OcrProvider;
  readonly consent?: boolean;
  readonly persistRecord?: (record: ReceiptRecord) => Promise<void>;
  readonly now?: () => string;
}
export type OcrServiceState = "consent_required" | "needs_review" | "manual_entry";
export interface OcrServiceResult { readonly state: OcrServiceState; readonly record: ReceiptRecord; }

export function validateReceiptFile(file: Pick<File, "name" | "type" | "size">, maxSize = RECEIPT_MAX_FILE_SIZE_BYTES): ReceiptFileValidation {
  if (!RECEIPT_IMAGE_MIME_TYPES.includes(file.type as (typeof RECEIPT_IMAGE_MIME_TYPES)[number])) return { valid: false, reason: "Only JPEG, PNG, or WebP receipt images are supported." };
  if (EXECUTABLE_EXTENSIONS.test(file.name)) return { valid: false, reason: "Executable and script file extensions are not allowed." };
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxSize) return { valid: false, reason: `Receipt images must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB.` };
  return { valid: true };
}

export async function processReceipt(input: ReceiptCaptureInput, options: OcrServiceOptions = {}): Promise<OcrServiceResult> {
  const validation = validateReceiptFile(input.file);
  if (!validation.valid) throw new Error(validation.reason);
  const now = options.now ?? (() => new Date().toISOString());
  const persist = options.persistRecord ?? saveReceiptRecord;
  const asset: ReceiptAsset = { ...input, file: input.file };
  const captured = createReceiptRecord(asset, now(), "captured");
  await persist(captured);
  if (!options.consent) return { state: "consent_required", record: captured };
  if (!options.provider) {
    const manual = withProcessingError(captured, "OCR is unavailable. Enter the receipt details manually. OCR was not used.", now());
    await persist(manual);
    return { state: "manual_entry", record: manual };
  }
  const processing = { ...captured, reviewStatus: "processing" as const, updatedAt: now() };
  await persist(processing);
  try {
    const reviewed = createReviewedRecord(processing, await options.provider.extract(asset), now());
    await persist(reviewed);
    return { state: "needs_review", record: reviewed };
  } catch {
    const manual = withProcessingError(processing, "OCR could not process this receipt. Enter the receipt details manually.", now());
    await persist(manual);
    return { state: "manual_entry", record: manual };
  }
}

export async function createManualReceipt(input: ReceiptCaptureInput, options: Pick<OcrServiceOptions, "persistRecord" | "now"> = {}): Promise<OcrServiceResult> {
  const validation = validateReceiptFile(input.file);
  if (!validation.valid) throw new Error(validation.reason);
  const now = options.now ?? (() => new Date().toISOString());
  const persist = options.persistRecord ?? saveReceiptRecord;
  const captured = createReceiptRecord({ ...input, file: input.file }, now(), "captured");
  await persist(captured);
  const manual = withProcessingError(captured, "Manual entry selected. OCR was not used.", now());
  await persist(manual);
  return { state: "manual_entry", record: manual };
}

export async function rejectReceipt(id: string, options: ConfirmReceiptOptions = {}): Promise<ReceiptRecord> {
  const record = await (options.getRecord ?? getReceiptRecord)(id);
  if (!record) throw new Error("Receipt record is unavailable for rejection.");
  const rejected: ReceiptRecord = { ...record, reviewStatus: "rejected", calculationInput: undefined, confirmedAt: undefined, updatedAt: (options.now ?? (() => new Date().toISOString()))() };
  await (options.saveRecord ?? saveReceiptRecord)(rejected);
  return rejected;
}

function createReceiptRecord(asset: ReceiptAsset, now: string, reviewStatus: ReceiptRecord["reviewStatus"]): ReceiptRecord {
  return { id: asset.assetRef, preparationId: asset.preparationId, assetRef: asset.assetRef, fileName: asset.fileName, mimeType: asset.mimeType, size: asset.size, reviewStatus, fields: emptyFields(), createdAt: now, updatedAt: now };
}

function createReviewedRecord(base: ReceiptRecord, extraction: OcrExtraction, now: string): ReceiptRecord {
  const fields = Object.fromEntries(Object.keys(extraction.fields).map((name) => [name, { value: extraction.fields[name as ReceiptFieldName], confidence: extraction.confidence[name as ReceiptFieldName] ?? null, source: "ocr", userConfirmed: false }])) as ReceiptFields;
  if (!isReceiptFieldsValid(fields)) throw new Error("OCR fields failed validation.");
  return { ...base, reviewStatus: "needs_review", fields, originalFields: fields, provenance: extraction.metadata, updatedAt: now, errorMessage: undefined };
}

function withProcessingError(record: ReceiptRecord, errorMessage: string, now: string): ReceiptRecord {
  return { ...record, reviewStatus: "needs_review", errorMessage, updatedAt: now };
}

function emptyFields(): ReceiptFields {
  const empty = { value: null, confidence: null, source: "ocr" as const, userConfirmed: false };
  return { vendor: empty, date: empty, amount: empty, taxAmount: empty, currency: empty, category: empty } as ReceiptFields;
}
