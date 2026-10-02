import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReceiptScanner from "@/components/receipts/ReceiptScanner";
import type { OcrProvider } from "@/lib/ocr/ocr-provider";

describe("ReceiptScanner", () => {
  it("requires explicit consent before sending a receipt to OCR", async () => {
    const provider: OcrProvider = {
      extract: vi.fn().mockResolvedValue({
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
      }),
    };
    const onConfirmed = vi.fn();

    render(
      <ReceiptScanner
        preparationId="prep-1"
        provider={provider}
        onConfirmed={onConfirmed}
      />,
    );

    const input = screen.getByLabelText("Receipt image");
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/consent/i)).toBeInTheDocument();
    const processButton = screen.getByRole("button", { name: /process with ocr/i });
    expect(processButton).toBeDisabled();
    expect(provider.extract).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: /consent/i }));
    fireEvent.click(processButton);

    await waitFor(() => expect(screen.getByText("Review extracted receipt")).toBeInTheDocument());
    expect(screen.getByLabelText("Vendor")).toHaveValue("Acme Foods");
    expect(screen.getAllByText(/low confidence/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /confirm receipt/i }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith(expect.objectContaining({ reviewStatus: "confirmed" })));
  });
});
