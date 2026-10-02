import { describe, expect, it } from "vitest";
import {
  getCalculationLabel,
  isEvidenceComplete,
} from "@/domain/tax-readiness";
import {
  hasRequiredCapabilityEvidence,
  type EvidenceMetadata,
  type JurisdictionCapability,
} from "@/domain/jurisdictions";
import {
  createPreparationRecord,
  getConfirmedCalculationInputs,
  getPreparationCalculationLabel,
  isAuthorityConfirmationValid,
  isPreparationCalculationReady,
  type PreparationRecord,
} from "@/domain/preparations";
import {
  defaultNigeriaForm,
  mapLegacyDeclaration,
} from "@/types/declaration";
import {
  isSubmissionEventValid,
  type SubmissionEvent,
} from "@/domain/submissions";

const verifiedEvidence: EvidenceMetadata = {
  source: "https://example.test/official-guidance",
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  verifiedAt: "2026-10-02",
  confidence: "high",
};

const genericCapability: JurisdictionCapability = {
  jurisdictionCode: "NG-LA",
  name: "Lagos",
  shortName: "Lagos",
  countryCode: "NG",
  ruleProfile: {
    kind: "generic_nigerian_pit",
    profileId: "ng-pit-baseline",
    version: "2026.1",
    baseline: {
      source: "Nigerian PIT baseline",
      effectiveFrom: "2026-01-01",
      reviewedAt: "2026-10-02",
    },
  },
  primaryReadiness: "Not yet supported",
  submissionModes: ["generic_export"],
  apiStatus: "not_pursued",
  deadlineProfile: { kind: "unverified", confidence: "low" },
  exportFormats: ["pdf", "csv", "xlsx"],
  evidence: {},
  notes: "Generic preparation and universal export are available.",
  registryVersion: "2026.1",
};

describe("preparation domain contracts", () => {
  it("uses the generic label unless a verified state rule profile exists", () => {
    expect(getCalculationLabel(genericCapability)).toBe("Generic Nigerian PIT estimate");
    expect(getCalculationLabel(genericCapability, "")).toBe("Not filing-ready");

    const verifiedCapability: JurisdictionCapability = {
      ...genericCapability,
      ruleProfile: {
        kind: "verified_state",
        profileId: "ng-la-pit",
        version: "2026.1",
        evidence: verifiedEvidence,
      },
    };

    expect(getCalculationLabel(verifiedCapability)).toBe("State-specific estimate");
    expect(isEvidenceComplete(verifiedEvidence)).toBe(true);
    expect(
      isEvidenceComplete({ ...verifiedEvidence, effectiveFrom: "" }),
    ).toBe(false);
    expect(
      getCalculationLabel({
        ...verifiedCapability,
        ruleProfile: {
          ...verifiedCapability.ruleProfile,
          evidence: { source: "unverified" },
        },
      } as unknown as JurisdictionCapability),
    ).toBe("Generic Nigerian PIT estimate");
  });

  it("requires evidence for authority-facing capability claims", () => {
    const guidedFixture: JurisdictionCapability = {
      ...genericCapability,
      primaryReadiness: "Guided manual filing",
      submissionModes: ["guided_manual"],
    };

    expect(hasRequiredCapabilityEvidence(genericCapability)).toBe(true);
    expect(hasRequiredCapabilityEvidence(guidedFixture)).toBe(false);
    expect(
      hasRequiredCapabilityEvidence({
        ...guidedFixture,
        evidence: { template: verifiedEvidence },
      }),
    ).toBe(true);
  });

  it("defines preparation and immutable submission event fields", () => {
    const preparation = {
      id: "prep-1",
      jurisdictionCode: "NG-LA",
      taxYear: "2026",
      ruleProfileVersion: "2026.1",
      calculationLabel: "Generic Nigerian PIT estimate",
      filingReadiness: "Not yet supported",
      status: "draft",
      formData: {},
      confirmedReceiptIds: [],
      confirmedReceiptInputs: {},
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    } satisfies PreparationRecord;

    const event = {
      id: "event-1",
      preparationId: preparation.id,
      type: "created",
      actor: "user",
      timestamp: "2026-10-02T00:00:00.000Z",
    } as const satisfies SubmissionEvent;

    expect(preparation.status).toBe("draft");
    expect(event.type).toBe("created");
  });

  it("keeps a mapped empty-jurisdiction legacy draft out of calculation-ready preparation", () => {
    const legacyDraft = mapLegacyDeclaration({ ...defaultNigeriaForm });
    const unselected = createPreparationRecord(
      {
        id: "prep-unselected",
        jurisdictionCode: legacyDraft.jurisdictionCode,
        taxYear: "2026",
        ruleProfileVersion: "2026.1",
        status: "draft",
        formData: { ...legacyDraft },
        confirmedReceiptIds: [],
        confirmedReceiptInputs: {},
        createdAt: "2026-10-02T00:00:00.000Z",
        updatedAt: "2026-10-02T00:00:00.000Z",
      },
      genericCapability,
    );

    expect(legacyDraft.jurisdictionCode).toBe("");
    expect(unselected.calculationLabel).toBe("Not filing-ready");
    expect(unselected.filingReadiness).toBe("Not filing-ready");
    expect(getPreparationCalculationLabel(unselected, genericCapability)).toBe(
      "Not filing-ready",
    );
    expect(isPreparationCalculationReady(unselected)).toBe(false);
  });

  it("requires authority evidence for authority-confirmed records and events", () => {
    const confirmation = {
      authorityReference: "NRS-2026-0001",
      confirmedAt: "2026-10-02T00:00:00.000Z",
    } as const;
    const confirmedPreparation = {
      id: "prep-confirmed",
      jurisdictionCode: "NG-LA",
      taxYear: "2026",
      ruleProfileVersion: "2026.1",
      calculationLabel: "Generic Nigerian PIT estimate",
      filingReadiness: "Not yet supported",
      status: "authority_confirmed",
      authorityConfirmation: confirmation,
      formData: {},
      confirmedReceiptIds: [],
      confirmedReceiptInputs: {},
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    } satisfies PreparationRecord;
    const confirmedEvent = {
      id: "event-confirmed",
      preparationId: confirmedPreparation.id,
      type: "authority_confirmed",
      actor: "authority",
      timestamp: confirmation.confirmedAt,
      authorityReference: confirmation.authorityReference,
    } as const satisfies SubmissionEvent;

    expect(isAuthorityConfirmationValid(confirmedPreparation)).toBe(true);
    expect(isSubmissionEventValid(confirmedEvent)).toBe(true);
    expect(
      isSubmissionEventValid({ ...confirmedEvent, authorityReference: "" }),
    ).toBe(false);
  });

  it("only exposes confirmed receipt inputs to calculation consumers", () => {
    const preparation = {
      id: "prep-receipts",
      jurisdictionCode: "NG-LA",
      taxYear: "2026",
      ruleProfileVersion: "2026.1",
      calculationLabel: "Generic Nigerian PIT estimate",
      filingReadiness: "Not yet supported",
      status: "draft",
      formData: { annualSalary: "1000000" },
      confirmedReceiptIds: [],
      confirmedReceiptInputs: { pensionReceipt: "1000" },
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    } satisfies PreparationRecord;

    expect(getConfirmedCalculationInputs(preparation)).toEqual({
      annualSalary: "1000000",
    });
    expect(
      getConfirmedCalculationInputs({
        ...preparation,
        confirmedReceiptIds: ["receipt-1"],
      }),
    ).toEqual({ annualSalary: "1000000", pensionReceipt: "1000" });
  });
});
