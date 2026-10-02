import {
  isAllowedReceiptCategory,
  isAllowedReceiptCurrency,
  isReceiptFieldsValid,
  type ReceiptAsset,
  type ReceiptFields,
  type ReceiptFieldName,
} from "@/domain/receipts";
import {
  OCR_FIELD_NAMES,
  type OcrExtraction,
  type OcrProvider,
  type OcrProviderMetadata,
} from "@/lib/ocr/ocr-provider";

export interface ManagedOcrConfig {
  readonly endpoint?: string;
  readonly apiKey?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly version?: string;
  readonly providerCategory?: string;
  readonly retentionPeriod?: string;
  readonly noTraining?: boolean;
  readonly fetchImpl?: typeof fetch;
}

export class ManagedOcrProvider implements OcrProvider {
  private readonly config: ManagedOcrConfig;

  constructor(config: ManagedOcrConfig = getManagedOcrConfig()) {
    this.config = config;
  }

  async extract(asset: ReceiptAsset): Promise<OcrExtraction> {
    const endpoint = this.config.endpoint?.trim();
    if (!endpoint || !this.config.apiKey?.trim()) {
      throw new Error("OCR provider is not configured.");
    }
    if (!asset.file) {
      throw new Error("Receipt content is unavailable for OCR processing.");
    }

    const body = new FormData();
    body.append("file", asset.file, asset.fileName);
    body.append("mimeType", asset.mimeType);

    const response = await (this.config.fetchImpl ?? fetch)(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      body,
    });
    if (!response.ok) {
      throw new Error("OCR provider request failed.");
    }

    const payload: unknown = await response.json();
    return parseManagedOcrResponse(payload, this.config);
  }
}

export function getManagedOcrConfig(): ManagedOcrConfig {
  const env = (import.meta as unknown as {
    env?: Record<string, string | undefined>;
  }).env ?? {};

  return {
    endpoint: env.VITE_OCR_ENDPOINT,
    apiKey: env.VITE_OCR_API_KEY,
    provider: env.VITE_OCR_PROVIDER,
    model: env.VITE_OCR_MODEL,
    version: env.VITE_OCR_VERSION,
    providerCategory: env.VITE_OCR_PROVIDER_CATEGORY,
    retentionPeriod: env.VITE_OCR_RETENTION_PERIOD,
    noTraining: env.VITE_OCR_NO_TRAINING === "true" ? true : undefined,
  };
}

export function parseManagedOcrResponse(
  payload: unknown,
  config: ManagedOcrConfig = {},
): OcrExtraction {
  if (!isPlainObject(payload) || !isPlainObject(payload.fields) || !isPlainObject(payload.confidence)) {
    throw new Error("OCR provider returned an invalid response.");
  }

  const fields = {
    vendor: stringOrNull(payload.fields.vendor),
    date: stringOrNull(payload.fields.date),
    amount: stringOrNull(payload.fields.amount),
    taxAmount: stringOrNull(payload.fields.taxAmount),
    currency: nullableAllowedCurrency(payload.fields.currency),
    category: nullableAllowedCategory(payload.fields.category),
  };
  const confidence = Object.fromEntries(
    OCR_FIELD_NAMES.map((name) => [name, nullableConfidence(payload.confidence[name])]),
  ) as OcrExtraction["confidence"];
  const metadata = {
    provider: nonEmptyString(config.provider) ?? nonEmptyString(getNestedString(payload.metadata, "provider")) ?? "managed-ocr",
    model: nonEmptyString(config.model) ?? nonEmptyString(getNestedString(payload.metadata, "model")) ?? "unknown",
    version: nonEmptyString(config.version) ?? nonEmptyString(getNestedString(payload.metadata, "version")) ?? "unknown",
    providerCategory: config.providerCategory,
    retentionPeriod: config.retentionPeriod,
    noTraining: config.noTraining,
  } satisfies OcrProviderMetadata;

  const wrappedFields = Object.fromEntries(
    OCR_FIELD_NAMES.map((name) => [name, {
      value: fields[name],
      confidence: confidence[name],
      source: "ocr",
      userConfirmed: false,
    }]),
  ) as ReceiptFields;
  if (!isReceiptFieldsValid(wrappedFields)) {
    throw new Error("OCR provider returned invalid receipt fields.");
  }

  return { fields, confidence, metadata };
}

function nullableConfidence(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("OCR provider returned invalid confidence.");
  }
  return value;
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 200) {
    throw new Error("OCR provider returned invalid field data.");
  }
  return value.trim();
}

function nullableAllowedCurrency(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !isAllowedReceiptCurrency(value)) {
    throw new Error("OCR provider returned an unsupported currency.");
  }
  return value;
}

function nullableAllowedCategory(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !isAllowedReceiptCategory(value)) {
    throw new Error("OCR provider returned an unsupported category.");
  }
  return value;
}

function getNestedString(value: unknown, key: string): string | undefined {
  return isPlainObject(value) ? nonEmptyString(value[key]) : undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
