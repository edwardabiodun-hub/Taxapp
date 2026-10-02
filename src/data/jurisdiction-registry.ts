import type { JurisdictionCapability } from "@/domain/jurisdictions";

const REGISTRY_VERSION = "2026.1";
const GENERIC_RULE_PROFILE_VERSION = "2026.1";
const REGISTRY_REVIEW_DATE = "2026-10-02";
const GENERIC_RULE_SOURCE = "Nigerian PIT baseline; state-specific source verification pending";

const genericRuleProfile = () => ({
  kind: "generic_nigerian_pit" as const,
  profileId: "ng-pit-baseline" as const,
  version: GENERIC_RULE_PROFILE_VERSION,
  source: GENERIC_RULE_SOURCE,
  verifiedAt: REGISTRY_REVIEW_DATE,
});

const createConservativeCapability = (
  jurisdictionCode: string,
  name: string,
  shortName = name,
): JurisdictionCapability => ({
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
  notes:
    "Generic Nigerian PIT preparation and universal export are available; state-specific rules and filing workflows require verified evidence.",
  registryVersion: REGISTRY_VERSION,
});

const nigeriaJurisdictions: JurisdictionCapability[] = [
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
);

const unknownCapability = createConservativeCapability(
  "NG-UNKNOWN",
  "Unknown Nigerian jurisdiction",
  "Unknown",
);

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
