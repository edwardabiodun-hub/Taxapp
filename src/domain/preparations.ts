import type {
  CalculationLabel,
  PreparationStatus,
  ReadinessLabel,
} from "@/domain/tax-readiness";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import { getCalculationLabel } from "@/domain/tax-readiness";

export type PreparationFormData = Record<string, unknown>;
export type ConfirmedReceiptInputs = Readonly<Record<string, unknown>>;
export type PreparationFilingReadiness = ReadinessLabel | "Not filing-ready";

export interface CalculationProvenance {
  readonly label: CalculationLabel;
  readonly ruleProfileId: string;
  readonly ruleProfileVersion: string;
  readonly source: string;
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
  readonly calculationProvenance?: CalculationProvenance;
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
  "calculationLabel" | "filingReadiness"
> & {
  readonly status: PreparationStatus;
  readonly authorityConfirmation?: AuthorityConfirmation;
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

  return {
    ...input,
    jurisdictionCode,
    calculationLabel: getCalculationLabel(capability, jurisdictionCode),
    filingReadiness: isSelected
      ? capability.primaryReadiness
      : "Not filing-ready",
  } as PreparationRecord;
}

export function getPreparationCalculationLabel(
  preparation: Pick<PreparationRecord, "jurisdictionCode">,
  capability: JurisdictionCapability,
): CalculationLabel {
  return getCalculationLabel(capability, preparation.jurisdictionCode);
}

export function isPreparationCalculationReady(
  preparation: Pick<
    PreparationRecord,
    "jurisdictionCode" | "calculationLabel"
  >,
): boolean {
  return (
    preparation.jurisdictionCode.trim().length > 0 &&
    preparation.calculationLabel !== "Not filing-ready"
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
