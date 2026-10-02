import { describe, expect, it, vi } from "vitest";
import { ManagedOcrProvider, parseManagedOcrResponse } from "@/lib/ocr/managed-ocr-provider";

const asset = {
  preparationId: "prep-1",
  assetRef: "receipts/receipt-1.jpg",
  fileName: "receipt.jpg",
  mimeType: "image/jpeg",
  size: 7,
  file: new File(["receipt"], "receipt.jpg", { type: "image/jpeg" }),
};

const payload = {
  fields: {
    vendor: "Acme Foods",
    date: "2026-09-30",
    amount: "12500",
    taxAmount: "937.50",
    currency: "NGN",
    category: "meals",
  },
  confidence: {
    vendor: 0.96,
    date: 0.89,
    amount: 0.71,
    taxAmount: 0.67,
    currency: 0.99,
    category: 0.62,
  },
  metadata: {
    provider: "managed-test",
    model: "receipt-v1",
    version: "1",
    contract: {
      providerCategory: "managed receipt extraction",
      retentionPeriod: "30 days",
      noTraining: true,
    },
  },
};

describe("managed OCR boundary", () => {
  it("sends receipt content only to the configured boundary without a client credential", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const extraction = await new ManagedOcrProvider({
      endpoint: "https://managed.example/ocr",
      fetchImpl,
    }).extract(asset);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://managed.example/ocr",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(fetchImpl.mock.calls[0][1].headers).toBeUndefined();
    expect(extraction.metadata).toEqual({
      provider: "managed-test",
      model: "receipt-v1",
      version: "1",
      contract: payload.metadata.contract,
    });
  });

  it("uses contract metadata returned by the managed boundary, never client metadata", () => {
    const extraction = parseManagedOcrResponse(payload, {
      endpoint: "https://managed.example/ocr",
    });

    expect(extraction.metadata.provider).toBe("managed-test");
    expect(extraction.metadata.contract?.noTraining).toBe(true);
  });

  it("fails closed when no managed boundary endpoint is configured", async () => {
    await expect(new ManagedOcrProvider({ fetchImpl: vi.fn() }).extract(asset)).rejects.toThrow(
      /not configured/i,
    );
  });
});
