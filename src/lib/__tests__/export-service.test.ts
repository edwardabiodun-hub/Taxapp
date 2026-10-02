import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { PreparationRecord } from "@/domain/preparations";
import { buildExportRows } from "@/lib/exports/export-data";
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
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("meal-receipt.jpg");
    expect(csv).not.toContain("receipt-needs-review");
    expect(csv).not.toContain("do-not-export");
    expect(csv).not.toContain("rawBytes");
  });

  it("exports only an explicit safe preparation allowlist across the shared export model", async () => {
    const unsafePreparation = {
      ...preparation,
      formData: {
        ...preparation.formData,
        annualSalary: "=1+1",
        receiptImage: "data:image/png;base64,PRIVATE_BYTES",
        imageData: "blob:http://localhost/private-image",
        credentials: "token=private-secret",
        unknownFutureField: "do-not-export",
        rawBytes: new Uint8Array([1, 2, 3]),
      },
    };

    const rows = buildExportRows({
      preparation: unsafePreparation,
      receipts: [],
      capability,
      metadata: {
        schemaVersion: "1.0.0",
        preparationId: preparation.id,
        jurisdiction: capability.name,
        jurisdictionCode: capability.jurisdictionCode,
        taxYear: preparation.taxYear,
        registryVersion: capability.registryVersion,
        ruleProfileId: "ng-pit-baseline",
        ruleProfileVersion: "2026.1",
        calculationLabel: preparation.calculationLabel,
        readiness: preparation.filingReadiness,
        source: "Nigerian PIT baseline",
        sourceVerifiedAt: "2026-10-01",
        deadlineSource: "NRS",
        deadlineVerifiedAt: "2026-10-01",
        generatedAt: "2026-10-02T00:00:00.000Z",
        notSubmitted: true,
      },
    });

    const serializedRows = JSON.stringify(rows);
    expect(serializedRows).toContain("annualSalary");
    expect(serializedRows).not.toContain("receiptImage");
    expect(serializedRows).not.toContain("imageData");
    expect(serializedRows).not.toContain("credentials");
    expect(serializedRows).not.toContain("unknownFutureField");
    expect(serializedRows).not.toContain("PRIVATE_BYTES");
    expect(serializedRows).not.toContain("private-image");
    expect(serializedRows).not.toContain("private-secret");

    const result = await generateExportPackage(unsafePreparation, [], capability, { persist: false });
    for (const artifact of result.artifacts) {
      const text = await artifact.data.text();
      expect(text).not.toContain("PRIVATE_BYTES");
      expect(text).not.toContain("private-image");
      expect(text).not.toContain("private-secret");
      expect(text).not.toContain("unknownFutureField");
    }
  });

  it.each([
    "data:image/png;base64,PRIVATE_BYTES",
    "blob:http://localhost/private-image",
    "base64:PRIVATE_BYTES",
    "raw-receipt-bytes",
    "receipts/private-token-secret",
  ])("omits and flags unsafe confirmed receipt assetRef %s", async (assetRef) => {
    const result = await generateExportPackage(
      preparation,
      [{ ...confirmedReceipt, assetRef }],
      capability,
      { persist: false },
    );
    const csv = await result.artifacts.find((artifact) => artifact.format === "csv")!.data.text();

    expect(csv).toContain("unsafe_receipt_reference");
    expect(csv).toContain("Omitted unsafe receipt reference");
    expect(csv).not.toContain(assetRef);
  });

  it("persists the complete export metadata alongside opaque artifact references", async () => {
    const exportRecords: unknown[] = [];
    const preparations: PreparationRecord[] = [];
    const unsafePreparation = {
      ...preparation,
      formData: {
        ...preparation.formData,
        credentials: "token=private-secret",
        unknownFutureField: "do-not-persist",
        rawBytes: new Uint8Array([1, 2, 3]),
      },
    };
    const result = await generateExportPackage(preparation, [], capability, {
      now: () => "2026-10-02T12:34:56.000Z",
      persist: true,
      persistence: {
        saveExportPackage: async (record) => { exportRecords.push(record); },
        savePreparation: async (record) => { preparations.push(record); },
      },
    });

    expect(exportRecords).toHaveLength(3);
    expect(exportRecords).toEqual(expect.arrayContaining([
      expect.objectContaining({
        schemaVersion: result.schemaVersion,
        preparationId: result.metadata.preparationId,
        jurisdiction: result.metadata.jurisdiction,
        jurisdictionCode: result.metadata.jurisdictionCode,
        taxYear: result.metadata.taxYear,
        ruleProfileVersion: result.metadata.ruleProfileVersion,
        calculationLabel: result.metadata.calculationLabel,
        readiness: result.metadata.readiness,
        generatedAt: result.metadata.generatedAt,
        notSubmitted: true,
        source: result.metadata.source,
        assetRef: expect.stringMatching(/^exports\/prep-export-1\/(pdf|csv|xlsx)\//),
        metadata: result.metadata,
      }),
    ]));
    expect(preparations).toEqual([
      expect.objectContaining({ status: "exported", lastExportedAt: result.generatedAt }),
    ]);

    preparations.length = 0;
    await generateExportPackage(unsafePreparation, [], capability, {
      now: () => "2026-10-02T12:34:56.000Z",
      persist: true,
      persistence: {
        saveExportPackage: async () => undefined,
        savePreparation: async (record) => { preparations.push(record); },
      },
    });

    expect(preparations[0].formData).toEqual({
      annualSalary: "1000000",
      annualRentPaid: "120000",
      documents: preparation.formData.documents,
    });
    expect(preparations[0].confirmedReceiptInputs).toEqual({});
    expect(JSON.stringify(preparations[0])).not.toContain("private-secret");
    expect(JSON.stringify(preparations[0])).not.toContain("do-not-persist");
    expect(JSON.stringify(preparations[0])).not.toContain("rawBytes");
  });

  it("moves a draft to exported when a persisted export succeeds", async () => {
    const draft = { ...preparation, status: "draft" as const };
    const preparations: PreparationRecord[] = [];

    const result = await generateExportPackage(draft, [], capability, {
      persist: true,
      persistence: {
        saveExportPackage: async () => undefined,
        savePreparation: async (record) => { preparations.push(record); },
      },
    });

    expect(result.status).toBe("exported");
    expect(preparations).toEqual([
      expect.objectContaining({ status: "exported", lastExportedAt: result.generatedAt }),
    ]);
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
