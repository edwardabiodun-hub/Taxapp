import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentsStep from "@/components/declaration/DocumentsStep";
import { getReceiptRecord } from "@/lib/receipt-repository";

vi.mock("@/lib/local-db", () => {
  const records = new Map<string, unknown>();
  return {
    db: {
      receiptRecords: {
        get: async (id: string) => records.get(id),
        put: async (record: { id: string }) => { records.set(record.id, record); },
        where: () => ({ equals: () => ({ toArray: async () => [...records.values()] }) }),
      },
    },
  };
});

vi.mock("@/lib/ocr/managed-ocr-provider", () => ({
  ManagedOcrProvider: class {
    async extract() {
      return {
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
        metadata: { provider: "managed-test", model: "receipt-v1", version: "1" },
      };
    }
  },
}));

describe("DocumentsStep receipt confirmation", () => {
  it("confirms through the repository operation and persists calculation input", async () => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:receipt-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    const onConfirmed = vi.fn();
    const onDocumentsChange = vi.fn();

    render(
      <DocumentsStep
        documents={[]}
        onDocumentsChange={onDocumentsChange}
        preparationId="prep-documents-test"
        onReceiptConfirmed={onConfirmed}
      />,
    );

    const input = screen.getByLabelText("Receipt image");
    fireEvent.change(input, {
      target: { files: [new File(["receipt"], "receipt.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /consent/i }));
    fireEvent.click(screen.getByRole("button", { name: /process with ocr/i }));

    await waitFor(() => expect(screen.getByText("Review extracted receipt")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /confirm receipt/i }));

    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(expect.objectContaining({ reviewStatus: "confirmed" })));
    const confirmed = onConfirmed.mock.calls[0][0];
    await expect(getReceiptRecord(confirmed.id)).resolves.toEqual(expect.objectContaining({
      reviewStatus: "confirmed",
      calculationInput: expect.objectContaining({ receiptId: confirmed.id }),
    }));
  });
});
