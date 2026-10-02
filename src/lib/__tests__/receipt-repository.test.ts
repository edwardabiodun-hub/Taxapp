import { describe, expect, it } from "vitest";
import { isReceiptRecordPersistable } from "@/lib/receipt-repository";

const receipt = {
  id: "receipt-1",
  preparationId: "prep-1",
  assetRef: "receipts/receipt-1.pdf",
  fileName: "receipt.pdf",
  mimeType: "application/pdf",
  size: 1024,
  status: "needs_review" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const fields = {
  vendor: { value: "Acme Foods", confidence: 0.96, source: "ocr" as const, userConfirmed: false },
  date: { value: "2026-09-30", confidence: 0.89, source: "ocr" as const, userConfirmed: false },
  amount: { value: "12500", confidence: 0.71, source: "ocr" as const, userConfirmed: false },
  taxAmount: { value: "937.50", confidence: 0.67, source: "ocr" as const, userConfirmed: false },
  currency: { value: "NGN", confidence: 0.99, source: "ocr" as const, userConfirmed: false },
  category: { value: "meals", confidence: 0.62, source: "ocr" as const, userConfirmed: false },
};

const reviewedReceipt = {
  ...receipt,
  reviewStatus: "needs_review" as const,
  fields,
};

const confirmedReceipt = {
  ...reviewedReceipt,
  reviewStatus: "confirmed" as const,
  fields: Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, { ...field, userConfirmed: true }]),
  ),
  confirmedAt: "2026-10-02T00:05:00.000Z",
  calculationInput: {
    receiptId: "receipt-1",
    vendor: "Acme Foods",
    date: "2026-09-30",
    amount: "12500",
    taxAmount: "937.50",
    currency: "NGN",
    category: "meals",
  },
};

describe("receipt persistence validation", () => {
  it("accepts only the supported extracted receipt fields", () => {
    expect(
      isReceiptRecordPersistable({
        ...receipt,
        extractedData: {
          vendorName: "Acme",
          receiptDate: "2026-01-01",
          totalAmount: 1250,
          currency: "NGN",
        },
      }),
    ).toBe(true);
  });

  it("rejects binary payloads and unknown extracted fields", () => {
    expect(
      isReceiptRecordPersistable({
        ...receipt,
        extractedData: { rawBytes: new Uint8Array([1, 2, 3]) },
      }),
    ).toBe(false);
    expect(
      isReceiptRecordPersistable({
        ...receipt,
        extractedData: { unapprovedField: "value" },
      }),
    ).toBe(false);
  });

  it.each([
    "data:application/pdf;base64,JVBERi0xLjQ=",
    "blob:https://example.test/receipt-1",
    "base64:JVBERi0xLjQ=",
    "SGVsbG8=",
    "SGVsbG8",
    "raw-receipt-bytes",
  ])("rejects inline asset reference %s", (assetRef) => {
    expect(isReceiptRecordPersistable({ ...receipt, assetRef })).toBe(false);
  });

  it.each(["receipts/receipt-1.pdf", "s3://bucket/receipt-1"]) (
    "accepts opaque storage reference %s",
    (assetRef) => {
      expect(isReceiptRecordPersistable({ ...receipt, assetRef })).toBe(true);
    },
  );

  it("rejects raw byte values in the asset reference field", () => {
    expect(
      isReceiptRecordPersistable({ ...receipt, assetRef: new Uint8Array([1, 2, 3]) }),
    ).toBe(false);
  });

  it("preserves valid legacy receipt metadata", () => {
    expect(
      isReceiptRecordPersistable({
        ...receipt,
        status: "needs_review",
        extractedData: {
          vendorName: "Acme Foods",
          receiptNumber: "INV-1001",
          receiptDate: "2026-09-30",
          currency: "NGN",
          subtotal: 11562.5,
          taxAmount: 937.5,
          totalAmount: 12500,
        },
        errorMessage: "OCR requires manual review.",
      }),
    ).toBe(true);
  });

  it.each([
    ["id", "data:text/plain;base64,cmF3LXJlY2VpcHQ="],
    ["preparationId", "blob:https://example.test/receipt-1"],
    ["fileName", "base64:JVBERi0xLjQ="],
    ["mimeType", "raw-receipt-bytes"],
    ["createdAt", "api-key=client-secret"],
    ["updatedAt", "x".repeat(201)],
    ["errorMessage", "secret receipt payload"],
    ["confirmedAt", "bearer token-value"],
  ] as const)("rejects unsafe legacy scalar %s", (field, value) => {
    expect(isReceiptRecordPersistable({ ...receipt, [field]: value })).toBe(false);
  });

  it.each([
    ["vendorName", "data:text/plain;base64,cmF3LXJlY2VpcHQ="],
    ["receiptNumber", "blob:https://example.test/receipt-1"],
    ["receiptDate", "base64:JVBERi0xLjQ="],
    ["currency", "api-key=client-secret"],
    ["vendorName", "x".repeat(201)],
  ] as const)("rejects unsafe legacy extractedData string %s", (field, value) => {
    expect(
      isReceiptRecordPersistable({
        ...receipt,
        extractedData: { [field]: value },
      }),
    ).toBe(false);
  });

  it.each([
    ["provenance", { provider: "managed", staleMetadata: "do-not-persist" }],
    ["fields", { vendor: { value: "Acme", staleField: "do-not-persist" } }],
    ["originalFields", { vendor: { value: "Acme", staleField: "do-not-persist" } }],
    ["correctionHistory", [{ field: "amount", staleCorrection: "do-not-persist" }]],
    ["calculationInput", { receiptId: "receipt-1", staleInput: "do-not-persist" }],
    ["errorMessage", { nestedPayload: "do-not-persist" }],
  ] as const)("rejects unknown nested keys in legacy %s metadata", (field, value) => {
    expect(isReceiptRecordPersistable({ ...receipt, [field]: value })).toBe(false);
  });

  it.each([
    ["receipt field", { ...reviewedReceipt, fields: { ...fields, amount: { ...fields.amount, staleValue: "x" } } }],
    ["provenance", { ...reviewedReceipt, provenance: { provider: "managed", model: "receipt-v1", version: "1", staleMetadata: "x" } }],
    ["trusted contract metadata", { ...reviewedReceipt, provenance: { provider: "managed", model: "receipt-v1", version: "1", contract: { staleContractClaim: "x" } } }],
    ["original OCR fields", { ...reviewedReceipt, originalFields: { ...fields, vendor: { ...fields.vendor, staleValue: "x" } } }],
    ["correction history", { ...reviewedReceipt, correctionHistory: [{ field: "amount", previousValue: "1", correctedValue: "2", at: "2026-10-02T00:05:00.000Z", staleCorrection: "x" }] }],
  ])("rejects unknown properties in nested %s", (_name, value) => {
    expect(isReceiptRecordPersistable(value)).toBe(false);
  });

  it("rejects unknown properties in confirmed calculation input", () => {
    expect(
      isReceiptRecordPersistable({
        ...confirmedReceipt,
        calculationInput: { ...confirmedReceipt.calculationInput, staleValue: "x" },
      }),
    ).toBe(false);
  });
});
