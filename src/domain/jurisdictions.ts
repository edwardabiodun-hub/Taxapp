import type { ReadinessLabel } from "@/domain/tax-readiness";

export type { CalculationLabel, ReadinessLabel } from "@/domain/tax-readiness";

export type RuleProfile =
  | {
      kind: "verified_state";
      profileId: string;
      version: string;
      source: string;
      verifiedAt: string;
    }
  | {
      kind: "generic_nigerian_pit";
      profileId: "ng-pit-baseline";
      version: string;
      source: string;
      verifiedAt: string;
    };

export type SubmissionMode =
  | "adapter"
  | "validated_export"
  | "guided_manual"
  | "generic_export";

export type ApiStatus =
  | "not_pursued"
  | "discovery"
  | "access_requested"
  | "sandbox"
  | "validated"
  | "production_ready";

export type DeadlineProfile = {
  kind: "verified_state" | "national_baseline" | "unverified";
  source?: string;
  verifiedAt?: string;
  confidence: "high" | "medium" | "low";
};

export type ExportFormat = "pdf" | "csv" | "xlsx";

export interface JurisdictionCapability {
  jurisdictionCode: string;
  name: string;
  shortName: string;
  countryCode: "NG";
  ruleProfile: RuleProfile;
  primaryReadiness: ReadinessLabel;
  submissionModes: SubmissionMode[];
  apiStatus: ApiStatus;
  deadlineProfile: DeadlineProfile;
  exportFormats: ExportFormat[];
  notes: string;
  registryVersion: string;
}
