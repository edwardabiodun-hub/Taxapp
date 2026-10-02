import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import ErrorState from "@/components/shared/ErrorState";
import {
  getCalculationReceiptInputs,
  type ReceiptFields,
  type ReceiptRecord,
} from "@/domain/receipts";
import type { PreparationRecord } from "@/domain/preparations";
import { db, type LocalDeclaration } from "@/lib/local-db";
import {
  getPreparation,
  listPendingPreparations,
  migrateLegacyDeclarationsToPreparations,
} from "@/lib/preparation-repository";
import {
  listReceiptRecords,
  saveReceiptRecord,
} from "@/lib/receipt-repository";
import {
  SubmissionService,
  type SubmissionRepository,
} from "@/lib/submission-service";
import { validateReceiptFile } from "@/lib/ocr/ocr-service";

const fields: ReceiptFields = {
  vendor: { value: "Example Foods", confidence: 0.96, source: "ocr", userConfirmed: false },
  date: { value: "2026-09-30", confidence: 0.89, source: "ocr", userConfirmed: false },
  amount: { value: "12500", confidence: 0.71, source: "ocr", userConfirmed: false },
  taxAmount: { value: "937.50", confidence: 0.67, source: "ocr", userConfirmed: false },
  currency: { value: "NGN", confidence: 0.99, source: "ocr", userConfirmed: false },
  category: { value: "meals", confidence: 0.62, source: "ocr", userConfirmed: false },
};

const reviewReceipt = (id: string, preparationId: string): ReceiptRecord => ({
  id,
  preparationId,
  assetRef: `receipts/${id}.jpg`,
  fileName: `${id}.jpg`,
  mimeType: "image/jpeg",
  size: 1024,
  reviewStatus: "needs_review",
  fields,
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
});

const confirmedReceipt: ReceiptRecord = {
  ...reviewReceipt("confirmed", "prep-owner"),
  reviewStatus: "confirmed",
  confirmedAt: "2026-10-02T00:05:00.000Z",
  fields: Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, { ...field, userConfirmed: true }]),
  ) as ReceiptFields,
  calculationInput: {
    receiptId: "confirmed",
    vendor: "Example Foods",
    date: "2026-09-30",
    amount: "12500",
    taxAmount: "937.50",
    currency: "NGN",
    category: "meals",
  },
};

const legacyDeclaration = (
  id: string,
  status: LocalDeclaration["status"],
  overrides: Partial<LocalDeclaration> = {},
): LocalDeclaration => ({
  id,
  taxYear: "2025",
  country: "ng",
  type: "Income Tax",
  status,
  formData: { annualSalary: "1000000" },
  documents: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
  pendingSync: false,
  ...overrides,
});

describe("phase one security boundaries", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("rejects executable extensions, unsupported MIME types, and unsafe sizes", () => {
    expect(validateReceiptFile(new File(["x"], "receipt.php", { type: "image/jpeg" })).valid).toBe(false);
    expect(validateReceiptFile(new File(["x"], "receipt.jpg", { type: "application/javascript" })).valid).toBe(false);
    expect(validateReceiptFile({ name: "receipt.jpg", type: "image/jpeg", size: 10 * 1024 * 1024 + 1 }).valid).toBe(false);
  });

  it("reapplies file metadata boundaries at the receipt repository", async () => {
    await expect(saveReceiptRecord({
      ...reviewReceipt("unsafe-extension", "prep-owner"),
      fileName: "receipt.php",
    })).rejects.toThrow(/metadata|asset/i);
    await expect(saveReceiptRecord({
      ...reviewReceipt("unsafe-mime", "prep-owner"),
      mimeType: "application/javascript",
    })).rejects.toThrow(/metadata|asset/i);
    await expect(saveReceiptRecord({
      ...reviewReceipt("oversized", "prep-owner"),
      size: 10 * 1024 * 1024 + 1,
    })).rejects.toThrow(/metadata|asset/i);
  });

  it("excludes unconfirmed, rejected, and tampered receipts from calculation inputs", () => {
    const rejected = { ...reviewReceipt("rejected", "prep-owner"), reviewStatus: "rejected" as const };
    const tampered = {
      ...confirmedReceipt,
      calculationInput: { ...confirmedReceipt.calculationInput!, amount: "999999" },
    };

    expect(getCalculationReceiptInputs([reviewReceipt("review", "prep-owner"), rejected, tampered, confirmedReceipt])).toEqual([
      confirmedReceipt.calculationInput,
    ]);
  });

  it("scopes receipt reads to the requested preparation boundary", async () => {
    await saveReceiptRecord(reviewReceipt("owner-receipt", "prep-owner"));
    await saveReceiptRecord(reviewReceipt("other-receipt", "prep-other"));

    await expect(listReceiptRecords("prep-owner")).resolves.toEqual([
      expect.objectContaining({ id: "owner-receipt", preparationId: "prep-owner" }),
    ]);
  });

  it("renders only the safe error catalog instead of provider details", () => {
    render(
      createElement(ErrorState, {
        errorCode: "OCR_UNAVAILABLE",
        title: "raw provider failure",
        message: "provider response includes api key synthetic-secret and stack trace",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/manual entry/i);
    expect(screen.queryByText(/raw provider failure|api key|synthetic-secret|stack trace/i)).not.toBeInTheDocument();
  });

  it("requires an authority reference before confirmation", async () => {
    let current: PreparationRecord = {
      id: "prep-authority",
      jurisdictionCode: "NG-FCT",
      taxYear: "2026",
      ruleProfileVersion: "",
      calculationLabel: "Generic Nigerian PIT estimate" as const,
      filingReadiness: "Not yet supported" as const,
      calculationProvenance: {
        label: "Generic Nigerian PIT estimate" as const,
        ruleProfileId: "ng-pit-baseline",
        ruleProfileVersion: "",
        source: "",
        effectiveTaxYears: [],
        effectiveFrom: "",
        verifiedAt: "",
        confidence: null,
        assumptions: [],
        missingInputWarnings: [],
      },
      formData: { country: "ng" },
      confirmedReceiptIds: [],
      confirmedReceiptInputs: {},
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
      status: "user_submitted" as const,
    };
    const repository: SubmissionRepository = {
      getPreparation: async () => current,
      savePreparation: async (next) => { current = next; },
      appendSubmissionEvent: async () => undefined,
      savePreparationAndAppendSubmissionEvent: async (next) => { current = next; },
      savePreparationAndAppendSubmissionEventWithExportPackages: async (next) => { current = next; },
    };
    const service = new SubmissionService({
      repository,
      now: () => "2026-10-02T12:00:00.000Z",
    });

    await expect(service.confirmAuthority("prep-authority", " ")).rejects.toThrow(/reference/i);
    expect(current.status).toBe("user_submitted");
  });

  it("rehearses legacy Nigeria drafts, submitted records, missing documents, and pending sync conservatively", async () => {
    const draft = legacyDeclaration("legacy-draft", "draft", { documents: [] });
    const submitted = legacyDeclaration("legacy-submitted", "submitted", { documents: [] });
    const pending = legacyDeclaration("legacy-pending", "submitted", { pendingSync: true, documents: [] });

    await migrateLegacyDeclarationsToPreparations([draft, submitted, pending]);

    await expect(getPreparation(draft.id)).resolves.toMatchObject({ status: "draft", formData: { documents: [] } });
    await expect(getPreparation(submitted.id)).resolves.toMatchObject({ status: "ready_for_review", formData: { documents: [] } });
    await expect(getPreparation(pending.id)).resolves.toMatchObject({ status: "ready_for_review", pendingSync: true });
    await expect(listPendingPreparations()).resolves.toEqual([
      expect.objectContaining({ id: pending.id, pendingSync: true }),
    ]);

    for (const id of [draft.id, submitted.id, pending.id]) {
      await expect(getPreparation(id)).resolves.not.toMatchObject({ status: "authority_confirmed" });
    }
  });
});
