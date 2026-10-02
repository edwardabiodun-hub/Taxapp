import { describe, expect, it, vi } from "vitest";
import {
  getCalculationReceiptInputs,
  type ReceiptFields,
  type ReceiptRecord,
} from "@/domain/receipts";
import {
  confirmReceiptRecord,
  processReceipt,
  validateReceiptFile,
} from "@/lib/ocr/ocr-service";
import type { OcrProvider } from "@/lib/ocr/ocr-provider";

const fields: ReceiptFields = {
  vendor: { value: "Acme Foods", confidence: 0.96, source: "ocr" as const, userConfirmed: false },
  date: { value: "2026-09-30", confidence: 0.89, source: "ocr" as const, userConfirmed: false },
  amount: { value: "12500", confidence: 0.71, source: "ocr" as const, userConfirmed: false },
  taxAmount: { value: "937.50", confidence: 0.67, source: "ocr" as const, userConfirmed: false },
  currency: { value: "NGN", confidence: 0.99, source: "ocr" as const, userConfirmed: false },
  category: { value: "meals", confidence: 0.62, source: "ocr" as const, userConfirmed: false },
};

const needsReviewReceipt: ReceiptRecord = {
  id: "receipt-review",
  preparationId: "prep-1",
  assetRef: "receipts/receipt-review.jpg",
  fileName: "receipt.jpg",
  mimeType: "image/jpeg",
  size: 1024,
  reviewStatus: "needs_review",
  fields,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
};

const confirmedReceipt: ReceiptRecord = {
  ...needsReviewReceipt,
  id: "receipt-confirmed",
  reviewStatus: "confirmed",
  calculationInput: {
    receiptId: "receipt-confirmed",
    vendor: "Acme Foods",
    date: "2026-09-30",
    amount: "12500",
    taxAmount: "937.50",
    currency: "NGN",
    category: "meals",
  },
};

describe("receipt OCR service", () => {
  it("excludes OCR fields until the user confirms the record", () => {
    expect(getCalculationReceiptInputs([needsReviewReceipt, confirmedReceipt])).toEqual([
      confirmedReceipt.calculationInput,
    ]);
  });

  it("preserves corrected values and marks them as user-confirmed", async () => {
    const record = await confirmReceiptRecord("receipt-1", needsReviewReceipt, {
      amount: "12500",
      category: "transport",
    });

    expect(record.reviewStatus).toBe("confirmed");
    expect(record.fields.amount.value).toBe("12500");
    expect(record.fields.amount.userConfirmed).toBe(true);
    expect(record.fields.category.value).toBe("transport");
    expect(record.calculationInput?.category).toBe("transport");
  });

  it("rejects executable extensions even when a browser reports an image MIME type", () => {
    const file = new File(["not an executable"], "receipt.php", {
      type: "image/jpeg",
    });

    expect(validateReceiptFile(file).valid).toBe(false);
    expect(validateReceiptFile(file).reason).toMatch(/extension/i);
  });

  it("falls back to manual entry when the OCR provider fails", async () => {
    const provider: OcrProvider = {
      extract: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    };
    const result = await processReceipt(
      {
        preparationId: "prep-1",
        file: new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
        assetRef: "receipts/receipt-1.jpg",
      },
      { provider },
    );

    expect(result.state).toBe("manual_entry");
    expect(result.record?.assetRef).toBe("receipts/receipt-1.jpg");
  });
});
