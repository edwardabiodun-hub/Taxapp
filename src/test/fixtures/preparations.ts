import type { PreparationRecord } from "@/domain/preparations";

/** Synthetic fixture only. It contains no real taxpayer data or authority claim. */
export const syntheticExportedPreparation: PreparationRecord = {
  id: "prep-lagos-synthetic",
  jurisdictionCode: "NG-LA",
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
  status: "exported",
  formData: {},
  confirmedReceiptIds: [],
  confirmedReceiptInputs: {},
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-02T12:00:00.000Z",
  lastExportedAt: "2026-10-02T12:00:00.000Z",
};

