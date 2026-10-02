import type {
  CapabilityEvidence,
  DeadlineProfile,
  EvidenceMetadata,
  JurisdictionCapability,
  RuleProfile,
} from "@/domain/jurisdictions";

const REGISTRY_VERSION = "2026.1";
const GENERIC_RULE_PROFILE_VERSION = "";
const GENERIC_RULE_SOURCE = "";

const freezeEvidence = (evidence: EvidenceMetadata): EvidenceMetadata =>
  Object.freeze({ ...evidence });

const freezeRuleProfile = (profile: RuleProfile): RuleProfile =>
  Object.freeze(
    profile.kind === "verified_state"
      ? { ...profile, evidence: freezeEvidence(profile.evidence) }
      : { ...profile, baseline: Object.freeze({ ...profile.baseline }) },
  );

const freezeDeadlineProfile = (profile: DeadlineProfile): DeadlineProfile =>
  Object.freeze(
    profile.kind === "unverified"
      ? { ...profile }
      : { ...profile, evidence: freezeEvidence(profile.evidence) },
  );

const freezeCapabilityEvidence = (
  evidence: CapabilityEvidence,
): CapabilityEvidence =>
  Object.freeze({
    ...evidence,
    ...(evidence.template
      ? { template: freezeEvidence(evidence.template) }
      : {}),
    ...(evidence.integration
      ? { integration: freezeEvidence(evidence.integration) }
      : {}),
  });

const freezeCapability = (
  capability: JurisdictionCapability,
): JurisdictionCapability =>
  Object.freeze({
    ...capability,
    ruleProfile: freezeRuleProfile(capability.ruleProfile),
    deadlineProfile: freezeDeadlineProfile(capability.deadlineProfile),
    submissionModes: Object.freeze([...capability.submissionModes]),
    exportFormats: Object.freeze([...capability.exportFormats]),
    evidence: freezeCapabilityEvidence(capability.evidence),
  });

const genericRuleProfile = (): RuleProfile => ({
  kind: "generic_nigerian_pit" as const,
  profileId: "ng-pit-baseline" as const,
  version: GENERIC_RULE_PROFILE_VERSION,
  baseline: {
    status: "unconfigured",
    source: GENERIC_RULE_SOURCE,
    effectiveFrom: "",
    reviewedAt: "",
  },
});

const createConservativeCapability = (
  jurisdictionCode: string,
  name: string,
  shortName = name,
): JurisdictionCapability => freezeCapability({
  jurisdictionCode,
  name,
  shortName,
  countryCode: "NG",
  ruleProfile: genericRuleProfile(),
  primaryReadiness: "Not yet supported",
  submissionModes: ["generic_export"],
  apiStatus: "not_pursued",
  deadlineProfile: { kind: "unverified", confidence: "low" },
  exportFormats: ["pdf", "csv", "xlsx"],
  evidence: {},
  notes:
    "Generic Nigerian PIT preparation is not filing-ready until an approved national baseline source is configured; state-specific rules and filing workflows require verified evidence.",
  registryVersion: REGISTRY_VERSION,
});

const nigeriaJurisdictions: readonly JurisdictionCapability[] = Object.freeze([
  ["NG-AB", "Abia"],
  ["NG-AD", "Adamawa"],
  ["NG-AK", "Akwa Ibom"],
  ["NG-AN", "Anambra"],
  ["NG-BA", "Bauchi"],
  ["NG-BY", "Bayelsa"],
  ["NG-BE", "Benue"],
  ["NG-BO", "Borno"],
  ["NG-CR", "Cross River"],
  ["NG-DE", "Delta"],
  ["NG-EB", "Ebonyi"],
  ["NG-ED", "Edo"],
  ["NG-EK", "Ekiti"],
  ["NG-EN", "Enugu"],
  ["NG-GO", "Gombe"],
  ["NG-IM", "Imo"],
  ["NG-JI", "Jigawa"],
  ["NG-KD", "Kaduna"],
  ["NG-KN", "Kano"],
  ["NG-KT", "Katsina"],
  ["NG-KE", "Kebbi"],
  ["NG-KO", "Kogi"],
  ["NG-KW", "Kwara"],
  ["NG-LA", "Lagos"],
  ["NG-NA", "Nasarawa"],
  ["NG-NI", "Niger"],
  ["NG-OG", "Ogun"],
  ["NG-ON", "Ondo"],
  ["NG-OS", "Osun"],
  ["NG-OY", "Oyo"],
  ["NG-PL", "Plateau"],
  ["NG-RI", "Rivers"],
  ["NG-SO", "Sokoto"],
  ["NG-TA", "Taraba"],
  ["NG-YO", "Yobe"],
  ["NG-ZA", "Zamfara"],
  ["NG-FCT", "Federal Capital Territory", "FCT"],
].map(([code, name, shortName]) =>
  createConservativeCapability(code, name, shortName),
));

const unknownCapability = Object.freeze(createConservativeCapability(
  "NG-UNKNOWN",
  "Unknown Nigerian jurisdiction",
  "Unknown",
));

export function listNigeriaJurisdictions(): readonly JurisdictionCapability[] {
  return nigeriaJurisdictions;
}

export function getJurisdictionCapability(code: string): JurisdictionCapability {
  const normalizedCode = code.trim().toUpperCase();
  return (
    nigeriaJurisdictions.find(
      (capability) => capability.jurisdictionCode === normalizedCode,
    ) ?? unknownCapability
  );
}
