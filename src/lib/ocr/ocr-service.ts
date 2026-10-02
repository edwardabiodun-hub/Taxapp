import {
  RECEIPT_IMAGE_MIME_TYPES,
  RECEIPT_MAX_FILE_SIZE_BYTES,
  isReceiptFieldsValid,
  type ReceiptAsset,
  type ReceiptCorrections,
  type ReceiptFieldName,
  type ReceiptFields,
  type ReceiptRecord,
} from "@/domain/receipts";
import type {
  OcrExtraction,
  OcrProvider,
} from "@/lib/ocr/ocr-provider";
import {
  getReceiptRecord,
  saveReceiptRecord,
} from "@/lib/receipt-repository";

const EXECUTABLE_EXTENSIONS = /\.(?:php|php[0-9]?|jsp|jspx|exe|sh|bash|bat|cmd|com|msi|dll|scr|ps1|vbs|js|mjs|cjs)$/i;

export interface ReceiptFileValidation {
  readonly valid: boolean;
  readonly reason?: string;
}

export interface ReceiptCaptureInput {
  readonly preparationId: string;
  readonly file: File;
  readonly assetRef: string;
}

export interface OcrServiceOptions {
  readonly provider?: OcrProvider;
  readonly consent?: boolean;
  readonly persistRecord?: (record: ReceiptRecord) => Promise<void>;
  readonly now?: () => string;
}

export type OcrServiceState =
  | "consent_required"
  | "needs_review"
  | "manual_entry";

export interface OcrServiceResult {
  readonly state: OcrServiceState;
  readonly record: ReceiptRecord;
}

export function validateReceiptFile(
  file: Pick<File, "name" | "type" | "size">,
  maxSize = RECEIPT_MAX_FILE_SIZE_BYTES,
): ReceiptFileValidation {
  if (!RECEIPT_IMAGE_MIME_TYPES.includes(file.type as (typeof RECEIPT_IMAGE_MIME_TYPES)[number])) {
    return { valid: false, reason: "Only JPEG, PNG, or WebP receipt images are supported." };
  }
  if (EXECUTABLE_EXTENSIONS.test(file.name)) {
    return { valid: false, reason: "Executable and script file extensions are not allowed." };
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxSize) {
    return { valid: false, reason: `Receipt images must be smaller than ${Math.round(maxSize / 1024 / 1024)}MB.` };
  }
  return { valid: true };
}

export async function processReceipt(
  input: ReceiptCaptureInput,
  options: OcrServiceOptions = {},
): Promise<OcrServiceResult> {
  const validation = validateReceiptFile(input.file);
  if (!validation.valid) throw new Error(validation.reason);

  const now = options.now ?? (() => new Date().toISOString());
  const persist = options.persistRecord ?? (async () => undefined);
  const asset: ReceiptAsset = {
    preparationId: input.preparationId,
    assetRef: input.assetRef,
    fileName: input.file.name,
    mimeType: input.file.type,
    size: input.file.size,
    file: input.file,
  };
  const captured = createReceiptRecord(asset, now(), "captured");
  await persist(captured);

  if (!options.consent) {
    return { state: "consent_required", record: captured };
  }

  if (!options.provider) {
    const manual = withProcessingError(captured, "OCR is unavailable. Enter the receipt details manually.", now());
    await persist(manual);
    return { state: "manual_entry", record: manual };
  }

  const processing = { ...captured, reviewStatus: "processing" as const, updatedAt: now() };
  await persist(processing);

  try {
    const extraction = await options.provider.extract(asset);
    const reviewed = createReviewedRecord(processing, extraction, now());
    await persist(reviewed);
    return { state: "needs_review", record: reviewed };
  } catch {
    const manual = withProcessingError(
      processing,
      "OCR could not process this receipt. Enter the receipt details manually.",
      now(),
    );
    await persist(manual);
    return { state: "manual_entry", record: manual };
  }
}

export async function confirmReceipt(
  id: string,
  corrections: ReceiptCorrections = {},
): Promise<ReceiptRecord> {
  const record = await getReceiptRecord(id);
  if (!record || !isNewReceiptRecord(record)) {
    throw new Error("Receipt record is unavailable for confirmation.");
  }
  const confirmed = await confirmReceiptRecord(id, record, corrections);
  await saveReceiptRecord(confirmed);
  return confirmed;
}

export async function confirmReceiptRecord(
  id: string,
  record: ReceiptRecord,
  corrections: ReceiptCorrections = {},
  now = new Date().toISOString(),
): Promise<ReceiptRecord> {
  if (record.id !== id) throw new Error("Receipt ID does not match the record.");
  if (record.reviewStatus === "rejected") throw new Error("Rejected receipts cannot be confirmed.");

  const fields = { ...record.fields } as Record<ReceiptFieldName, ReceiptFields[ReceiptFieldName]>;
  for (const [name, value] of Object.entries(corrections) as [ReceiptFieldName, string | null][]) {
    if (!isCorrectionAllowed(name, value)) {
      throw new Error(`Invalid receipt ${name} value.`);
    }
    fields[name] = {
      ...fields[name],
      value: value === null || value === "" ? null : value,
      source: "user",
      userConfirmed: true,
    } as ReceiptFields[ReceiptFieldName];
  }

  const confirmedFields = Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, { ...field, userConfirmed: true }]),
  ) as ReceiptFields;
  if (!isReceiptFieldsValid(confirmedFields)) {
    throw new Error("Receipt fields are invalid or inconsistent.");
  }

  return {
    ...record,
    fields: confirmedFields,
    reviewStatus: "confirmed",
    calculationInput: toCalculationInput(id, confirmedFields),
    confirmedAt: now,
    updatedAt: now,
    errorMessage: undefined,
  };
}

export function rejectReceiptRecord(
  record: ReceiptRecord,
  now = new Date().toISOString(),
): ReceiptRecord {
  return { ...record, reviewStatus: "rejected", updatedAt: now, calculationInput: undefined };
}

function createReceiptRecord(
  asset: ReceiptAsset,
  now: string,
  reviewStatus: ReceiptRecord["reviewStatus"],
): ReceiptRecord {
  return {
    id: asset.assetRef,
    preparationId: asset.preparationId,
    assetRef: asset.assetRef,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
    reviewStatus,
    fields: emptyFields(),
    createdAt: now,
    updatedAt: now,
  };
}

function createReviewedRecord(
  base: ReceiptRecord,
  extraction: OcrExtraction,
  now: string,
): ReceiptRecord {
  const fields = Object.fromEntries(
    (Object.keys(extraction.fields) as ReceiptFieldName[]).map((name) => [name, {
      value: extraction.fields[name],
      confidence: extraction.confidence[name] ?? null,
      source: "ocr",
      userConfirmed: false,
    }]),
  ) as ReceiptFields;
  if (!isReceiptFieldsValid(fields)) throw new Error("OCR fields failed validation.");

  return {
    ...base,
    reviewStatus: "needs_review",
    fields,
    provenance: extraction.metadata,
    updatedAt: now,
    errorMessage: undefined,
  };
}

function withProcessingError(
  record: ReceiptRecord,
  errorMessage: string,
  now: string,
): ReceiptRecord {
  return { ...record, reviewStatus: "needs_review", errorMessage, updatedAt: now };
}

function emptyFields(): ReceiptFields {
  return {
    vendor: { value: null, confidence: null, source: "ocr", userConfirmed: false },
    date: { value: null, confidence: null, source: "ocr", userConfirmed: false },
    amount: { value: null, confidence: null, source: "ocr", userConfirmed: false },
    taxAmount: { value: null, confidence: null, source: "ocr", userConfirmed: false },
    currency: { value: null, confidence: null, source: "ocr", userConfirmed: false },
    category: { value: null, confidence: null, source: "ocr", userConfirmed: false },
  };
}

function toCalculationInput(id: string, fields: ReceiptFields) {
  return {
    receiptId: id,
    vendor: fields.vendor.value,
    date: fields.date.value,
    amount: fields.amount.value,
    taxAmount: fields.taxAmount.value,
    currency: fields.currency.value,
    category: fields.category.value,
  };
}

function isCorrectionAllowed(name: ReceiptFieldName, value: string | null): boolean {
  if (value === null || value === "") return true;
  const field = {
    value,
    confidence: null,
    source: "user" as const,
    userConfirmed: true,
  } as ReceiptFields[ReceiptFieldName];
  return isReceiptFieldsValid({
    ...emptyFields(),
    [name]: field,
  } as ReceiptFields);
}

function isNewReceiptRecord(value: unknown): value is ReceiptRecord {
  return Boolean(value && typeof value === "object" && "reviewStatus" in value && "fields" in value);
}
