import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import type { ExportPackage } from "@/domain/exports";
import type { UserSubmissionEvidence } from "@/domain/submissions";

export interface SubmissionPackage {
  readonly id: string;
  readonly preparationId: string;
  readonly exportPackage: ExportPackage;
  readonly handoff: {
    readonly mode: "manual" | "portal" | "direct";
    readonly instructions: readonly string[];
    readonly notSubmitted: true;
  };
}

export interface SubmissionContext {
  readonly evidence?: UserSubmissionEvidence;
}

export interface UserSubmissionResult {
  readonly preparationId: string;
  readonly status: "user_submitted";
  readonly evidence: UserSubmissionEvidence;
}

export interface AuthorityStatus {
  readonly preparationId?: string;
  readonly status: "unavailable" | "user_submitted" | "authority_confirmed";
  readonly source: "universal_export" | "authority_adapter";
  readonly authorityReference?: string;
  readonly message?: string;
}

export interface SubmissionAdapter {
  readonly id: string;
  prepare(
    preparation: PreparationRecord,
    capability: JurisdictionCapability,
  ): Promise<SubmissionPackage>;
  submit(
    submissionPackage: SubmissionPackage,
    context: SubmissionContext,
  ): Promise<UserSubmissionResult>;
  getStatus(reference: string): Promise<AuthorityStatus>;
}
