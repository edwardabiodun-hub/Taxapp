export interface FeatureFlags {
  readonly nationalJurisdictions: boolean;
  readonly genericPreparation: boolean;
  readonly universalExports: boolean;
  readonly deadlineTracker: boolean;
  readonly receiptOcr: boolean;
  readonly submissionAdapters: boolean;
}

export type FeatureFlagEnvironment = Record<string, unknown>;

const FLAG_KEYS = {
  nationalJurisdictions: "FILESMART_ENABLE_NATIONAL_JURISDICTIONS",
  genericPreparation: "FILESMART_ENABLE_GENERIC_PREPARATION",
  universalExports: "FILESMART_ENABLE_UNIVERSAL_EXPORTS",
  deadlineTracker: "FILESMART_ENABLE_DEADLINE_TRACKER",
  receiptOcr: "FILESMART_ENABLE_OCR",
  submissionAdapters: "FILESMART_ENABLE_SUBMISSION_ADAPTERS",
} as const;

const DEFAULT_FLAGS: FeatureFlags = {
  nationalJurisdictions: true,
  genericPreparation: true,
  universalExports: true,
  deadlineTracker: true,
  receiptOcr: false,
  submissionAdapters: false,
};

function importMetaEnv(): FeatureFlagEnvironment {
  return (import.meta as unknown as { env?: FeatureFlagEnvironment }).env ?? {};
}

function readFlagValue(environment: FeatureFlagEnvironment, key: string): unknown {
  return environment[key] ?? environment[`VITE_${key}`];
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;

  switch (value.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
    case "on":
      return true;
    case "false":
    case "0":
    case "no":
    case "off":
      return false;
    default:
      return fallback;
  }
}

export function resolveFeatureFlags(
  environment: FeatureFlagEnvironment = importMetaEnv(),
): FeatureFlags {
  return Object.freeze({
    nationalJurisdictions: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.nationalJurisdictions),
      DEFAULT_FLAGS.nationalJurisdictions,
    ),
    genericPreparation: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.genericPreparation),
      DEFAULT_FLAGS.genericPreparation,
    ),
    universalExports: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.universalExports),
      DEFAULT_FLAGS.universalExports,
    ),
    deadlineTracker: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.deadlineTracker),
      DEFAULT_FLAGS.deadlineTracker,
    ),
    receiptOcr: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.receiptOcr),
      DEFAULT_FLAGS.receiptOcr,
    ),
    submissionAdapters: parseBoolean(
      readFlagValue(environment, FLAG_KEYS.submissionAdapters),
      DEFAULT_FLAGS.submissionAdapters,
    ),
  });
}

export const featureFlags = resolveFeatureFlags();
