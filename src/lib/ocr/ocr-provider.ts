import type {
  ReceiptAsset,
  ReceiptCategory,
  ReceiptCurrency,
  ReceiptFieldName,
} from "@/domain/receipts";

export type OcrFieldValue = string | null;

export type OcrFieldValues = Readonly<
  Record<ReceiptFieldName, OcrFieldValue>
> & {
  readonly currency: ReceiptCurrency | null;
  readonly category: ReceiptCategory | null;
};

export type OcrConfidence = Readonly<Record<ReceiptFieldName, number | null>>;

export interface OcrProviderMetadata {
  readonly provider: string;
  readonly model: string;
  readonly version: string;
  readonly providerCategory?: string;
  readonly retentionPeriod?: string;
  readonly noTraining?: boolean;
}

export interface OcrExtraction {
  readonly fields: OcrFieldValues;
  readonly confidence: OcrConfidence;
  readonly metadata: OcrProviderMetadata;
}

export interface OcrProvider {
  extract(asset: ReceiptAsset): Promise<OcrExtraction>;
}

export const OCR_FIELD_NAMES: readonly ReceiptFieldName[] = [
  "vendor",
  "date",
  "amount",
  "taxAmount",
  "currency",
  "category",
];
