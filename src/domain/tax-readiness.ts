import type { JurisdictionCapability } from "@/domain/jurisdictions";

export type ReadinessLabel =
  | "Direct filing"
  | "Portal-ready export"
  | "Guided manual filing"
  | "Not yet supported";

export type CalculationLabel =
  | "State-specific estimate"
  | "Generic Nigerian PIT estimate"
  | "Not filing-ready";

export type PreparationStatus =
  | "draft"
  | "ready_for_review"
  | "exported"
  | "user_submitted"
  | "authority_confirmed";

/**
 * A capability can only claim state-specific calculations when its rule
 * profile is explicitly verified. Generic profiles remain generic regardless
 * of the selected jurisdiction's readiness label.
 */
export function getCalculationLabel(
  capability: JurisdictionCapability,
): CalculationLabel {
  return capability.ruleProfile.kind === "verified_state"
    ? "State-specific estimate"
    : "Generic Nigerian PIT estimate";
}
