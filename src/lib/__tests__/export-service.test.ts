import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { PreparationRecord } from "@/domain/preparations";
import { generateExportPackage } from "@/lib/exports/export-service";

const capability = getJurisdictionCapability("NG-LA");

const preparation: PreparationRecord = {
  id: "prep-export-1",
  jurisdictionCode: capability.jurisdictionCode,
  taxYear: "2026",
  ruleProfileVersion: "",
  calculationLabel: "Generic Nigerian PIT estimate",
  filingReadiness: "Not yet supported",
  calculationProvenance: {
    label: "Generic Nigerian PIT estimate",
    ruleProfileId: "ng-pit-baseline",
    ruleProfileVersion: "",
    source: "",
    effectiveTaxYears: [],
    effectiveFrom: "",
    verifiedAt: "",
    confidence: null,
    assumptions: ["No state-specific rules are claimed."],
    missingInputWarnings: [],
  },
  formData: {
    annualSalary: "1000000",
    annualRentPaid: "120000",
    "=unsafeFormula": "@do-not-execute",
    taxId: "do-not-export",
    documents: [
      {
        id: "doc-1",
        name: "payslip.pdf",
        size: 1024,
        type: "application/pdf",
        category: "income",
      },
    ],
  },
  confirmedReceiptIds: ["receipt-confirmed"],
  confirmedReceiptInputs: {},
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  status: "ready_for_review",
};

const confirmedReceipt = {
  id: "receipt-confirmed",
  preparationId: preparation.id,
  assetRef: "receipts/receipt-confirmed.jpg",
  fileName: "meal-receipt.jpg",
  mimeType: "image/jpeg",
  size: 1234,
  reviewStatus: "confirmed" as const,
  fields: {
    vendor: { value: "Cafe", confidence: 1, source: "user" as const, userConfirmed: true },
    date: { value: "2026-09-30", confidence: 1, source: "user" as const, userConfirmed: true },
    amount: { value: "5000", confidence: 1, source: "user" as const, userConfirmed: true },
    taxAmount: { value: "0", confidence: 1, source: "user" as const, userConfirmed: true },
    currency: { value: "NGN" as const, confidence: 1, source: "user" as const, userConfirmed: true },
    category: { value: "meals" as const, confidence: 1, source: "user" as const, userConfirmed: true },
  },
  calculationInput: {
    receiptId: "receipt-confirmed",
    vendor: "Cafe",
    date: "2026-09-30",
    amount: "5000",
    taxAmount: "0",
    currency: "NGN" as const,
    category: "meals" as const,
  },
  confirmedAt: "2026-10-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const needsReviewReceipt = {
  ...confirmedReceipt,
  id: "receipt-needs-review",
  reviewStatus: "needs_review" as const,
  calculationInput: undefined,
  confirmedAt: undefined,
};

describe("universal export service", () => {
  it("generates all universal formats for an unsupported jurisdiction", async () => {
    const result = await generateExportPackage(preparation, [], capability, { persist: false });

    expect(result.artifacts.map((artifact) => artifact.format)).toEqual(["pdf", "csv", "xlsx"]);
    expect(result.status).toBe("exported");
    expect(result.schemaVersion).toBeTruthy();
    expect(result.metadata.notSubmitted).toBe(true);
    expect(result.metadata.calculationLabel).toBe("Generic Nigerian PIT estimate");
    expect(result.metadata.jurisdictionCode).toBe("NG-LA");
    expect(result.artifacts.every((artifact) => artifact.data instanceof Blob)).toBe(true);
  });

  it("keeps CSV formula-safe and excludes unconfirmed receipt data and tax IDs", async () => {
    const result = await generateExportPackage(
      preparation,
      [confirmedReceipt, needsReviewReceipt],
      capability,
      { persist: false },
    );
    const csv = await result.artifacts.find((artifact) => artifact.format === "csv")!.data.text();

    expect(csv).toContain("schema_version,section,field,label,value,source,reference,category,date,amount,status");
    expect(csv).toContain("'@do-not-execute");
    expect(csv).toContain("meal-receipt.jpg");
    expect(csv).not.toContain("receipt-needs-review");
    expect(csv).not.toContain("do-not-export");
    expect(csv).not.toContain("rawBytes");
  });

  it("includes required workbook sheets and a not-submitted notice", async () => {
    const result = await generateExportPackage(preparation, [], capability, { persist: false });
    const workbookArtifact = result.artifacts.find((artifact) => artifact.format === "xlsx")!;
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await workbookArtifact.data.arrayBuffer(), { type: "array" });

    expect(workbook.SheetNames).toEqual(["Summary", "Income & Deductions", "Assumptions", "Document Index"]);
    expect(XLSX.utils.sheet_to_csv(workbook.Sheets.Summary)).toContain("Not submitted");
  });
});
