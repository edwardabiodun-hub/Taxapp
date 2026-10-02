import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JurisdictionStep from "@/components/declaration/JurisdictionStep";
import { listNigeriaJurisdictions } from "@/data/jurisdiction-registry";
import ErrorState from "@/components/shared/ErrorState";
import OcrReview from "@/components/receipts/OcrReview";
import type { ReceiptRecord } from "@/domain/receipts";

const emptyReceiptFields = {
  vendor: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
  date: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
  amount: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
  taxAmount: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
  currency: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
  category: { value: null, confidence: null, source: "ocr" as const, userConfirmed: false },
};

const receiptWithUnsafeError = {
  id: "receipt-1",
  preparationId: "prep-1",
  assetRef: "receipt-asset:1",
  fileName: "receipt.jpg",
  mimeType: "image/jpeg",
  size: 100,
  reviewStatus: "needs_review" as const,
  fields: emptyReceiptFields,
  errorMessage: "provider response includes api key sk-live-secret and stack trace",
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
} satisfies ReceiptRecord;

describe("shared UX states and keyboard behavior", () => {
  it("allows keyboard selection of a jurisdiction", () => {
    const onSelect = vi.fn();

    render(
      <JurisdictionStep
        selectedCode=""
        onSelect={onSelect}
        capabilities={listNigeriaJurisdictions()}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /jurisdiction/i }), {
      target: { value: "Ogun" },
    });
    const ogun = screen.getByRole("button", { name: /Ogun/i });
    ogun.focus();
    fireEvent.keyDown(ogun, { key: "Enter", code: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("NG-OG");
  });

  it("renders a human-readable OCR error without provider details", () => {
    render(
      <ErrorState
        title="raw provider failure"
        message="provider response includes api key sk-live-secret"
        errorCode="OCR_UNAVAILABLE"
      />,
    );

    expect(screen.getByText(/try manual entry/i)).toBeInTheDocument();
    expect(screen.queryByText(/raw provider failure|api key|sk-live-secret/i)).not.toBeInTheDocument();
  });

  it("does not render persisted receipt error text", () => {
    render(
      <OcrReview
        record={receiptWithUnsafeError}
        onConfirm={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText(/receipt could not be processed/i)).toBeInTheDocument();
    expect(screen.queryByText(/provider response|api key|sk-live-secret|stack trace/i)).not.toBeInTheDocument();
  });
});
