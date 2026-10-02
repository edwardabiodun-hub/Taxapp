import { describe, expect, it } from "vitest";
import type { PreparationRecord } from "@/domain/preparations";
import type { LocalDeclaration } from "@/lib/local-db";
import { mergeSubmissionRecords } from "@/lib/submission-records";

const preparation = (id: string): PreparationRecord => ({
  id,
  jurisdictionCode: "NG-FCT",
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
    assumptions: [],
    missingInputWarnings: [],
  },
  formData: { country: "ng" },
  confirmedReceiptIds: [],
  confirmedReceiptInputs: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  status: "ready_for_review",
});

const declaration = (id: string, status: LocalDeclaration["status"] = "submitted"): LocalDeclaration => ({
  id,
  taxYear: "2025",
  country: "ng",
  type: "Income Tax",
  status,
  formData: { annualSalary: "1000000" },
  documents: [],
  amount: "1000",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-03T00:00:00.000Z",
  pendingSync: false,
});

describe("submission records", () => {
  it("keeps legacy declarations visible when no preparation exists", () => {
    const records = mergeSubmissionRecords([preparation("migrated")], [
      declaration("migrated"),
      declaration("legacy-only"),
    ]);

    expect(records).toHaveLength(2);
    expect(records.find((record) => record.id === "legacy-only")).toMatchObject({
      kind: "legacy",
      declaration: { id: "legacy-only", amount: "1000" },
    });
  });

  it("merges a migrated preparation with its legacy row without deleting legacy data", () => {
    const legacy = declaration("migrated");
    const [record] = mergeSubmissionRecords([preparation("migrated")], [legacy]);

    expect(record).toMatchObject({
      kind: "preparation",
      preparation: { id: "migrated" },
      legacy: { id: "migrated", type: "Income Tax" },
    });
  });
});
