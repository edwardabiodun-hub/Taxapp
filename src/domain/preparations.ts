import type {
  CalculationLabel,
  PreparationStatus,
  ReadinessLabel,
} from "@/domain/tax-readiness";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import { getCalculationLabel } from "@/domain/tax-readiness";
import { calculatePreparation } from "@/lib/calculation-service";

export type PreparationFormData = Record<string, unknown>;
export type ConfirmedReceiptInputs = Readonly<Record<string, unknown>>;
export type PreparationFilingReadiness = ReadinessLabel | "Not filing-ready";

export interface CalculationProvenance {
  readonly label: CalculationLabel;
  readonly ruleProfileId: string;
  readonly ruleProfileVersion: string;
  readonly source: string;
  readonly effectiveTaxYears: readonly string[];
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly verifiedAt: string;
  readonly confidence: "high" | "medium" | "low" | null;
  readonly assumptions: readonly string[];
  readonly missingInputWarnings: readonly string[];
}

export interface AuthorityConfirmation {
  readonly authorityReference: string;
  readonly confirmedAt: string;
}

interface PreparationRecordBase {
  readonly id: string;
  readonly jurisdictionCode: string;
  readonly taxYear: string;
  readonly ruleProfileVersion: string;
  readonly calculationLabel: CalculationLabel;
  readonly filingReadiness: PreparationFilingReadiness;
  readonly calculationProvenance: CalculationProvenance;
  readonly formData: PreparationFormData;
  readonly confirmedReceiptIds: readonly string[];
  /** Receipt-derived values are kept outside formData and enter only after confirmation. */
  readonly confirmedReceiptInputs: ConfirmedReceiptInputs;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastExportedAt?: string;
}

export type PreparationRecordInput = Omit<
  PreparationRecordBase,
  "calculationLabel" | "filingReadiness" | "calculationProvenance"
> & {
  readonly status: PreparationStatus;
  readonly authorityConfirmation?: AuthorityConfirmation;
  readonly calculationProvenance?: CalculationProvenance;
};

export type PreparationRecord =
  | (PreparationRecordBase & {
      readonly status: Exclude<PreparationStatus, "authority_confirmed">;
      readonly authorityConfirmation?: never;
    })
  | (PreparationRecordBase & {
      readonly status: "authority_confirmed";
      readonly authorityConfirmation: AuthorityConfirmation;
    });

/**
 * Creates a preparation from a capability without allowing an unresolved
 * legacy draft to inherit a generic calculation label or filing readiness.
 */
export function createPreparationRecord(
  input: PreparationRecordInput,
  capability: JurisdictionCapability,
): PreparationRecord {
  const jurisdictionCode = input.jurisdictionCode.trim();
  const isSelected = jurisdictionCode.length > 0;

  if (
    input.status === "authority_confirmed" &&
    (!input.authorityConfirmation ||
      input.authorityConfirmation.authorityReference.trim().length === 0 ||
      input.authorityConfirmation.confirmedAt.trim().length === 0)
  ) {
    throw new Error(
      "Authority confirmation requires a non-empty authority reference and timestamp.",
    );
  }

  if (input.status !== "authority_confirmed" && input.authorityConfirmation) {
    throw new Error(
      "Only authority-confirmed preparations may include authority confirmation.",
    );
  }

  if (!isSelected && input.status === "authority_confirmed") {
    throw new Error(
      "An unselected jurisdiction cannot be authority confirmed.",
    );
  }

  const calculation = calculatePreparation(
    {
      ...(input.formData as Record<string, unknown>),
      taxYear: input.taxYear,
      jurisdictionCode,
    },
    capability,
  );

  return {
    ...input,
    jurisdictionCode,
    ruleProfileVersion: calculation.ruleProfileVersion,
    calculationLabel: calculation.label,
    filingReadiness: calculation.filingReadiness,
    calculationProvenance: calculation.provenance,
  } as PreparationRecord;
}

export function getPreparationCalculationLabel(
  preparation: Pick<
    PreparationRecord,
    "jurisdictionCode" | "calculationProvenance"
  >,
  capability: JurisdictionCapability,
): CalculationLabel {
  if (!preparation.calculationProvenance) {
    return "Not filing-ready";
  }

  const capabilityLabel = getCalculationLabel(
    capability,
    preparation.jurisdictionCode,
  );
  return capabilityLabel === "State-specific estimate" &&
    preparation.calculationProvenance.label !== "State-specific estimate"
    ? "Not filing-ready"
    : preparation.calculationProvenance.label;
}

function hasCompleteCalculationProvenance(
  provenance: CalculationProvenance | undefined,
): provenance is CalculationProvenance {
  if (!provenance || provenance.missingInputWarnings.length > 0) {
    return false;
  }

  return (
    provenance.label !== "Not filing-ready" &&
    provenance.ruleProfileVersion.trim().length > 0 &&
    provenance.source.trim().length > 0 &&
    provenance.effectiveTaxYears.length > 0 &&
    provenance.effectiveFrom.trim().length > 0 &&
    provenance.verifiedAt.trim().length > 0 &&
    provenance.confidence !== null
  );
}

export function isPreparationCalculationReady(
  preparation: Pick<
    PreparationRecord,
    "jurisdictionCode" | "calculationLabel" | "calculationProvenance"
  >,
): boolean {
  return (
    preparation.jurisdictionCode.trim().length > 0 &&
    preparation.calculationLabel !== "Not filing-ready" &&
    hasCompleteCalculationProvenance(preparation.calculationProvenance)
  );
}

export function isAuthorityConfirmationValid(
  preparation: PreparationRecord,
): boolean {
  if (preparation.status !== "authority_confirmed") {
    return preparation.authorityConfirmation === undefined;
  }

  return (
    preparation.authorityConfirmation.authorityReference.trim().length > 0 &&
    preparation.authorityConfirmation.confirmedAt.trim().length > 0
  );
}

export function getConfirmedCalculationInputs(
  preparation: Pick<
    PreparationRecord,
    "formData" | "confirmedReceiptIds" | "confirmedReceiptInputs"
  >,
): Record<string, unknown> {
  if (preparation.confirmedReceiptIds.length === 0) {
    return { ...preparation.formData };
  }

  return {
    ...preparation.formData,
    ...preparation.confirmedReceiptInputs,
  };
}
