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
});
