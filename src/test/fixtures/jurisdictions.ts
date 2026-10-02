import type { JurisdictionCapability } from "@/domain/jurisdictions";

/** Synthetic fixture only. It does not represent an authority endorsement. */
export const syntheticLagosCapability: JurisdictionCapability = Object.freeze({
  jurisdictionCode: "NG-LA",
  name: "Synthetic Lagos jurisdiction",
  shortName: "Synthetic Lagos",
  countryCode: "NG",
  ruleProfile: {
    kind: "generic_nigerian_pit",
    profileId: "ng-pit-baseline",
    version: "",
    baseline: {
      status: "unconfigured",
      source: "",
      effectiveFrom: "",
      reviewedAt: "",
    },
  },
  primaryReadiness: "Not yet supported",
  submissionModes: ["generic_export"],
  apiStatus: "not_pursued",
  deadlineProfile: { kind: "unverified", confidence: "low" },
  exportFormats: ["pdf", "csv", "xlsx"],
  evidence: {},
  notes: "Synthetic fixture for local UI tests only.",
  registryVersion: "fixture-1",
});

