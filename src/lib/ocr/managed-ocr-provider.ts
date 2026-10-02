import {
  isAllowedReceiptCategory,
  isAllowedReceiptCurrency,
  isReceiptFieldsValid,
  isReceiptProvenanceSafe,
  type ReceiptAsset,
  type ReceiptFields,
  type ReceiptProvenance,
} from "@/domain/receipts";
import { OCR_FIELD_NAMES, type OcrExtraction, type OcrProvider, type OcrProviderMetadata } from "@/lib/ocr/ocr-provider";

export interface ManagedOcrConfig {
  readonly endpoint?: string;
  readonly fetchImpl?: typeof fetch;
}

export class ManagedOcrProvider implements OcrProvider {
  constructor(private readonly config: ManagedOcrConfig = getManagedOcrConfig()) {}

  async extract(asset: ReceiptAsset): Promise<OcrExtraction> {
    const endpoint = this.config.endpoint?.trim();
    if (!endpoint || !isTrustedBoundaryEndpoint(endpoint)) throw new Error("OCR provider is not configured.");
    if (!asset.file) throw new Error("Receipt content is unavailable for OCR processing.");

    const body = new FormData();
    body.append("file", asset.file, asset.fileName);
    body.append("mimeType", asset.mimeType);
    const response = await (this.config.fetchImpl ?? fetch)(endpoint, { method: "POST", body });
    if (!response.ok) throw new Error("OCR provider request failed.");
    return parseManagedOcrResponse(await response.json());
  }
}

export function getManagedOcrConfig(): ManagedOcrConfig {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return { endpoint: env.VITE_OCR_ENDPOINT };
}

export function parseManagedOcrResponse(payload: unknown, _config: ManagedOcrConfig = {}): OcrExtraction {
  if (!isPlainObject(payload) || !isPlainObject(payload.fields) || !isPlainObject(payload.confidence) || !isPlainObject(payload.metadata)) {
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
  const confidence = Object.fromEntries(OCR_FIELD_NAMES.map((name) => [name, nullableConfidence(payload.confidence[name])])) as OcrExtraction["confidence"];
  const metadata = parseMetadata(payload.metadata);
  const wrappedFields = Object.fromEntries(OCR_FIELD_NAMES.map((name) => [name, {
    value: fields[name], confidence: confidence[name], source: "ocr", userConfirmed: false,
  }])) as ReceiptFields;
  if (!isReceiptFieldsValid(wrappedFields)) throw new Error("OCR provider returned invalid receipt fields.");
  return { fields, confidence, metadata };
}

function parseMetadata(value: Record<string, unknown>): OcrProviderMetadata {
  const provider = requiredSafeText(value.provider);
  const model = requiredSafeText(value.model);
  const version = requiredSafeText(value.version);
  const rawContract = value.contract;
  let contract: ReceiptProvenance["contract"];
  if (rawContract !== undefined) {
    if (!isPlainObject(rawContract)) throw new Error("OCR provider returned invalid contract metadata.");
    contract = {
      providerCategory: optionalSafeText(rawContract.providerCategory),
      retentionPeriod: optionalSafeText(rawContract.retentionPeriod),
      noTraining: optionalBoolean(rawContract.noTraining),
    };
  }
  const metadata = { provider, model, version, ...(contract ? { contract } : {}) };
  if (!isReceiptProvenanceSafe(metadata)) throw new Error("OCR provider returned unsafe metadata.");
  return metadata;
}

function isTrustedBoundaryEndpoint(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function requiredSafeText(value: unknown): string {
  const text = optionalSafeText(value);
  if (!text) throw new Error("OCR provider returned incomplete metadata.");
  return text;
}

function optionalSafeText(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > 160 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error("OCR provider returned invalid metadata.");
  return value.trim();
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new Error("OCR provider returned invalid contract metadata.");
  return value;
}

function nullableConfidence(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new Error("OCR provider returned invalid confidence.");
  return value;
}

function stringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 200) throw new Error("OCR provider returned invalid field data.");
  return value.trim();
}

function nullableAllowedCurrency(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !isAllowedReceiptCurrency(value)) throw new Error("OCR provider returned an unsupported currency.");
  return value;
}

function nullableAllowedCategory(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !isAllowedReceiptCategory(value)) throw new Error("OCR provider returned an unsupported category.");
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
