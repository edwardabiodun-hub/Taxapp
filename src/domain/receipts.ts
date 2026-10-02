export const RECEIPT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const RECEIPT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const RECEIPT_CURRENCIES = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "CAD",
  "AUD",
  "ZAR",
  "GHS",
  "KES",
] as const;

export const RECEIPT_CATEGORIES = [
  "meals",
  "transport",
  "office",
  "utilities",
  "accommodation",
  "professional_services",
  "other",
] as const;

export type ReceiptCurrency = (typeof RECEIPT_CURRENCIES)[number];
export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];
export type ReceiptReviewStatus =
  | "captured"
  | "processing"
  | "needs_review"
  | "confirmed"
  | "rejected";
export type ReceiptFieldName =
  | "vendor"
  | "date"
  | "amount"
  | "taxAmount"
  | "currency"
  | "category";

export interface ReceiptAsset {
  readonly preparationId: string;
  /** Opaque private-storage reference. It is never a data/blob URL or byte payload. */
  readonly assetRef: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly size: number;
  /** Transient browser file; never persist this property in a ReceiptRecord. */
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

export interface ReceiptProvenance {
  readonly provider: string;
  readonly model: string;
  readonly version: string;
  readonly providerCategory?: string;
  readonly retentionPeriod?: string;
  readonly noTraining?: boolean;
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
  readonly provenance?: ReceiptProvenance;
  readonly calculationInput?: ConfirmedReceiptInput;
  readonly errorMessage?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly confirmedAt?: string;
}

export type ReceiptCorrections = Partial<
  Record<ReceiptFieldName, string | null>
>;

export function getCalculationReceiptInputs(
  records: readonly ReceiptRecord[],
): ConfirmedReceiptInput[] {
  return records
    .filter(
      (record) =>
        record.reviewStatus === "confirmed" &&
        record.calculationInput?.receiptId === record.id,
    )
    .map((record) => record.calculationInput as ConfirmedReceiptInput);
}

export function isAllowedReceiptCurrency(
  value: unknown,
): value is ReceiptCurrency {
  return typeof value === "string" && RECEIPT_CURRENCIES.includes(value as ReceiptCurrency);
}

export function isAllowedReceiptCategory(
  value: unknown,
): value is ReceiptCategory {
  return typeof value === "string" && RECEIPT_CATEGORIES.includes(value as ReceiptCategory);
}

export function isValidReceiptFieldValue(
  name: ReceiptFieldName,
  value: unknown,
): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 200) return false;

  if (name === "currency") return isAllowedReceiptCurrency(value);
  if (name === "category") return isAllowedReceiptCategory(value);
  if (name === "date") return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  if (name === "amount" || name === "taxAmount") {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1_000_000_000_000;
  }

  return value.trim().length > 0;
}

export function isReceiptFieldsValid(fields: ReceiptFields): boolean {
  return (
    Object.entries(fields).every(([name, field]) =>
      isReceiptFieldObject(field) &&
      isValidReceiptFieldValue(name as ReceiptFieldName, field.value) &&
      (field.confidence === null ||
        (typeof field.confidence === "number" &&
          Number.isFinite(field.confidence) &&
          field.confidence >= 0 &&
          field.confidence <= 1)),
    ) &&
    (!fields.amount.value ||
      !fields.taxAmount.value ||
      Number(fields.taxAmount.value) <= Number(fields.amount.value))
  );
}

function isReceiptFieldObject(value: unknown): value is ReceiptField {
  return Boolean(
    value &&
      typeof value === "object" &&
      "value" in value &&
      "confidence" in value &&
      (value as ReceiptField).source !== undefined &&
      typeof (value as ReceiptField).userConfirmed === "boolean",
  );
}
