import type {
  CalculationLabel,
  PreparationStatus,
  ReadinessLabel,
} from "@/domain/tax-readiness";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import { getCalculationLabel } from "@/domain/tax-readiness";

export type PreparationFormData = Record<string, unknown>;
export type ConfirmedReceiptInputs = Readonly<Record<string, unknown>>;

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
  readonly filingReadiness: ReadinessLabel;
  readonly formData: PreparationFormData;
  readonly confirmedReceiptIds: readonly string[];
  /** Receipt-derived values are kept outside formData and enter only after confirmation. */
  readonly confirmedReceiptInputs: ConfirmedReceiptInputs;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastExportedAt?: string;
}

export type PreparationRecord =
  | (PreparationRecordBase & {
      readonly status: Exclude<PreparationStatus, "authority_confirmed">;
      readonly authorityConfirmation?: never;
    })
  | (PreparationRecordBase & {
      readonly status: "authority_confirmed";
      readonly authorityConfirmation: AuthorityConfirmation;
    });

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
