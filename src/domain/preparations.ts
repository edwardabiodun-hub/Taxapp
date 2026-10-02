import type {
  CalculationLabel,
  PreparationStatus,
  ReadinessLabel,
} from "@/domain/tax-readiness";

export type PreparationFormData = Record<string, unknown>;

export interface PreparationRecord {
  id: string;
  jurisdictionCode: string;
  taxYear: string;
  ruleProfileVersion: string;
  calculationLabel: CalculationLabel;
  filingReadiness: ReadinessLabel;
  status: PreparationStatus;
  formData: PreparationFormData;
  confirmedReceiptIds: string[];
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string;
}
