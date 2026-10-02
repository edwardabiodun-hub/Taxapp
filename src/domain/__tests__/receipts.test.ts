import { describe, expect, it } from "vitest";
import {
  isConfirmedReceiptRecord,
  isReceiptFieldsValid,
  isReceiptProvenanceSafe,
  type ReceiptFields,
  type ReceiptRecord,
} from "@/domain/receipts";

const confirmedFields: ReceiptFields = {
  vendor: { value: "Acme Foods", confidence: 0.96, source: "ocr", userConfirmed: true },
  date: { value: "2026-09-30", confidence: 0.89, source: "ocr", userConfirmed: true },
  amount: { value: "12500", confidence: 0.71, source: "ocr", userConfirmed: true },
  taxAmount: { value: "937.50", confidence: 0.67, source: "ocr", userConfirmed: true },
  currency: { value: "NGN", confidence: 0.99, source: "ocr", userConfirmed: true },
  category: { value: "meals", confidence: 0.62, source: "ocr", userConfirmed: true },
};

const confirmedReceipt: ReceiptRecord = {
  id: "receipt-confirmed",
  preparationId: "prep-1",
  assetRef: "receipts/receipt-confirmed.jpg",
  fileName: "receipt.jpg",
  mimeType: "image/jpeg",
  size: 1024,
  reviewStatus: "confirmed",
  fields: confirmedFields,
  confirmedAt: "2026-10-02T00:05:00.000Z",
  calculationInput: {
    receiptId: "receipt-confirmed",
    vendor: "Acme Foods",
    date: "2026-09-30",
    amount: "12500",
    taxAmount: "937.50",
    currency: "NGN",
    category: "meals",
  },
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:05:00.000Z",
};

describe("receipt nested schema validation", () => {
  it("rejects unknown properties in receipt field objects", () => {
    expect(
      isReceiptFieldsValid({
        ...confirmedFields,
        amount: { ...confirmedFields.amount, staleValue: "do-not-persist" },
      } as unknown as ReceiptFields),
    ).toBe(false);
  });

  it("rejects unknown properties in calculation input", () => {
    expect(
      isConfirmedReceiptRecord({
        ...confirmedReceipt,
        calculationInput: {
          ...confirmedReceipt.calculationInput,
          staleValue: "do-not-persist",
        },
      } as unknown as ReceiptRecord),
    ).toBe(false);
  });

  it("rejects unknown properties in provenance and trusted contract metadata", () => {
    expect(
      isReceiptProvenanceSafe({
        provider: "managed-test",
        model: "receipt-v1",
        version: "1",
        staleMetadata: "do-not-persist",
      }),
    ).toBe(false);
    expect(
      isReceiptProvenanceSafe({
        provider: "managed-test",
        model: "receipt-v1",
        version: "1",
        contract: {
          providerCategory: "structured receipt extraction",
          staleContractClaim: "do-not-persist",
        },
      }),
    ).toBe(false);
  });

  it("rejects unknown properties in original OCR fields and correction history", () => {
    expect(
      isConfirmedReceiptRecord({
        ...confirmedReceipt,
        originalFields: {
          ...confirmedFields,
          vendor: { ...confirmedFields.vendor, staleValue: "do-not-persist" },
        },
      } as unknown as ReceiptRecord),
    ).toBe(false);
    expect(
      isConfirmedReceiptRecord({
        ...confirmedReceipt,
        correctionHistory: [{
          field: "amount",
          previousValue: "10000",
          correctedValue: "12500",
          at: "2026-10-02T00:05:00.000Z",
          staleCorrection: "do-not-persist",
        }],
      } as unknown as ReceiptRecord),
    ).toBe(false);
  });
});
