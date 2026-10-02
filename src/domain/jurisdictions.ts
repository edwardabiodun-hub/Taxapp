import type { ReadinessLabel } from "@/domain/tax-readiness";

export type { CalculationLabel, ReadinessLabel } from "@/domain/tax-readiness";

export type EvidenceConfidence = "high" | "medium" | "low";

/** Evidence required for a jurisdiction-specific or authority-facing claim. */
export interface EvidenceMetadata {
  readonly source: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly verifiedAt: string;
  readonly confidence: EvidenceConfidence;
}

export interface DeadlineEvidenceMetadata extends EvidenceMetadata {
  readonly dueAt: string;
  readonly taxYear: string;
  readonly timezone: string;
  readonly recurrence?: string;
}

/** Review metadata for the generic national baseline, not state verification. */
export interface BaselineMetadata {
  readonly status?: "configured" | "unconfigured";
  readonly source: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly reviewedAt: string;
}

export interface CapabilityEvidence {
  readonly template?: EvidenceMetadata;
  readonly integration?: EvidenceMetadata;
}

export type RuleProfile =
  | {
      kind: "verified_state";
      profileId: string;
      version: string;
      evidence: EvidenceMetadata;
    }
  | {
      kind: "generic_nigerian_pit";
      profileId: "ng-pit-baseline";
      version: string;
      baseline: BaselineMetadata;
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

export type DeadlineProfile =
  | {
      kind: "verified_state" | "national_baseline";
      evidence: DeadlineEvidenceMetadata;
    }
  | {
      kind: "unverified";
      confidence: "low";
    };

export type ExportFormat = "pdf" | "csv" | "xlsx";

export interface JurisdictionCapability {
  readonly jurisdictionCode: string;
  readonly name: string;
  readonly shortName: string;
  readonly countryCode: "NG";
  readonly ruleProfile: RuleProfile;
  readonly primaryReadiness: ReadinessLabel;
  readonly submissionModes: readonly SubmissionMode[];
  readonly apiStatus: ApiStatus;
  readonly deadlineProfile: DeadlineProfile;
  /** Optional national fallback carried by a jurisdiction capability snapshot. */
  readonly nationalDeadlineProfile?: DeadlineProfile;
  readonly exportFormats: readonly ExportFormat[];
  readonly evidence: CapabilityEvidence;
  readonly notes: string;
  readonly registryVersion: string;
}

export function isEvidenceComplete(value: unknown): value is EvidenceMetadata {
  if (!value || typeof value !== "object") return false;

  const evidence = value as Partial<EvidenceMetadata>;
  return (
    typeof evidence.source === "string" && evidence.source.trim().length > 0 &&
    typeof evidence.effectiveFrom === "string" &&
    evidence.effectiveFrom.trim().length > 0 &&
    typeof evidence.verifiedAt === "string" &&
    evidence.verifiedAt.trim().length > 0 &&
    (evidence.confidence === "high" ||
      evidence.confidence === "medium" ||
      evidence.confidence === "low")
  );
}

export function hasRequiredCapabilityEvidence(
  capability: JurisdictionCapability,
): boolean {
  const hasVerifiedRuleEvidence =
    capability.ruleProfile.kind !== "verified_state" ||
    isEvidenceComplete(capability.ruleProfile.evidence);
  const hasVerifiedDeadlineEvidence =
    capability.deadlineProfile.kind === "unverified" ||
    isEvidenceComplete(capability.deadlineProfile.evidence);
  const requiresTemplateEvidence =
    capability.primaryReadiness === "Guided manual filing" ||
    capability.primaryReadiness === "Portal-ready export" ||
    capability.submissionModes.some(
      (mode) => mode === "guided_manual" || mode === "validated_export",
    );
  const requiresIntegrationEvidence =
    capability.primaryReadiness === "Direct filing" ||
    capability.submissionModes.includes("adapter") ||
    capability.apiStatus !== "not_pursued";

  return (
    hasVerifiedRuleEvidence &&
    hasVerifiedDeadlineEvidence &&
    (!requiresTemplateEvidence || isEvidenceComplete(capability.evidence.template)) &&
    (!requiresIntegrationEvidence ||
      isEvidenceComplete(capability.evidence.integration))
  );
}
