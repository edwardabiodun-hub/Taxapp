import {
  resolveFeatureFlags,
  type FeatureFlagEnvironment,
  type FeatureFlags,
} from "@/lib/feature-flags";

export interface PublicRuntimeConfig {
  readonly featureFlags: FeatureFlags;
  readonly endpoints: {
    readonly ocr?: string;
    readonly jurisdictionCapabilities?: string;
  };
}

function importMetaEnv(): FeatureFlagEnvironment {
  return (import.meta as unknown as { env?: FeatureFlagEnvironment }).env ?? {};
}

function publicEndpoint(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const endpoint = value.trim();
  return endpoint.length > 0 ? endpoint : undefined;
}

export function getPublicRuntimeConfig(
  environment: FeatureFlagEnvironment = importMetaEnv(),
): PublicRuntimeConfig {
  return Object.freeze({
    featureFlags: resolveFeatureFlags(environment),
    endpoints: Object.freeze({
      ocr: publicEndpoint(environment.VITE_OCR_ENDPOINT),
      jurisdictionCapabilities: publicEndpoint(
        environment.VITE_JURISDICTION_CAPABILITIES_ENDPOINT,
      ),
    }),
  });
}

export const getRuntimeConfig = getPublicRuntimeConfig;
