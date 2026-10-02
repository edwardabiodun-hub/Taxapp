import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { resolveFeatureFlags } from "@/lib/feature-flags";
import { getPublicRuntimeConfig } from "@/lib/runtime-config";
import { loadJurisdictionCapabilities } from "@/lib/jurisdiction-service";

const cachedLagosCapability = {
  jurisdictionCode: "NG-LA",
  name: "Lagos",
  shortName: "Lagos",
  countryCode: "NG" as const,
  ruleProfile: {
    kind: "verified_state" as const,
    profileId: "lagos-pit",
    version: "1.0",
    evidence: {
      source: "Lagos Internal Revenue Service",
      effectiveFrom: "2026-01-01",
      verifiedAt: "2026-02-01",
      confidence: "high" as const,
    },
  },
  primaryReadiness: "Guided manual filing" as const,
  submissionModes: ["guided_manual"] as const,
  apiStatus: "validated" as const,
  deadlineProfile: {
    kind: "verified_state" as const,
    evidence: {
      source: "Lagos Internal Revenue Service",
      effectiveFrom: "2026-01-01",
      verifiedAt: "2026-02-01",
      confidence: "high" as const,
      dueAt: "2026-03-31",
      taxYear: "2026",
      timezone: "Africa/Lagos",
    },
  },
  exportFormats: ["pdf", "csv", "xlsx"] as const,
  evidence: {
    template: {
      source: "Lagos Internal Revenue Service",
      effectiveFrom: "2026-01-01",
      verifiedAt: "2026-02-01",
      confidence: "high" as const,
    },
    integration: {
      source: "Lagos Internal Revenue Service",
      effectiveFrom: "2026-01-01",
      verifiedAt: "2026-02-01",
      confidence: "high" as const,
    },
  },
  notes: "Verified cached Lagos capability",
  registryVersion: "2026.1",
};

describe("phase-one feature controls", () => {
  it("keeps generic preparation and exports available when OCR is disabled", () => {
    const flags = resolveFeatureFlags({ FILESMART_ENABLE_OCR: "false" });

    expect(flags.nationalJurisdictions).toBe(true);
    expect(flags.genericPreparation).toBe(true);
    expect(flags.universalExports).toBe(true);
    expect(flags.deadlineTracker).toBe(true);
    expect(flags.receiptOcr).toBe(false);
  });

  it("disables submission adapters independently of the generic workflow", () => {
    const flags = resolveFeatureFlags({
      FILESMART_ENABLE_SUBMISSION_ADAPTERS: "false",
    });

    expect(flags.genericPreparation).toBe(true);
    expect(flags.universalExports).toBe(true);
    expect(flags.submissionAdapters).toBe(false);
  });

  it("uses bundled conservative registry data when refresh fails", async () => {
    const failingRefresh = async () => {
      throw new Error("registry unavailable");
    };

    await expect(loadJurisdictionCapabilities({ refresh: failingRefresh })).resolves.toHaveLength(37);
  });

  it("preserves valid cached evidence when no registry endpoint is configured", async () => {
    let writtenCapabilities: typeof cachedLagosCapability[] | undefined;
    const capabilities = await loadJurisdictionCapabilities({
      cache: {
        read: async () => [cachedLagosCapability],
        write: async (value) => {
          writtenCapabilities = value as typeof cachedLagosCapability[];
        },
      },
    });

    expect(capabilities.find(({ jurisdictionCode }) => jurisdictionCode === "NG-LA")).toEqual(
      cachedLagosCapability,
    );
    expect(writtenCapabilities?.find(({ jurisdictionCode }) => jurisdictionCode === "NG-LA")).toEqual(
      cachedLagosCapability,
    );
  });

  it("preserves cached evidence when refresh returns an empty registry", async () => {
    let writtenCapabilities: typeof cachedLagosCapability[] | undefined;
    const capabilities = await loadJurisdictionCapabilities({
      refresh: async () => [],
      cache: {
        read: async () => [cachedLagosCapability],
        write: async (value) => {
          writtenCapabilities = value as typeof cachedLagosCapability[];
        },
      },
    });

    expect(capabilities).toHaveLength(37);
    expect(capabilities.find(({ jurisdictionCode }) => jurisdictionCode === "NG-LA")).toEqual(
      cachedLagosCapability,
    );
    expect(capabilities.find(({ jurisdictionCode }) => jurisdictionCode === "NG-AB")).toEqual(
      getJurisdictionCapability("NG-AB"),
    );
    expect(writtenCapabilities?.find(({ jurisdictionCode }) => jurisdictionCode === "NG-LA")).toEqual(
      cachedLagosCapability,
    );
  });

  it("exposes only public runtime configuration", () => {
    const config = getPublicRuntimeConfig({
      VITE_OCR_ENDPOINT: "https://example.test/ocr",
      VITE_JURISDICTION_CAPABILITIES_ENDPOINT: "https://example.test/capabilities",
      VITE_SUPABASE_SERVICE_ROLE_KEY: "should-not-escape",
      VITE_LLM_API_KEY: "should-not-escape",
    });

    expect(config.endpoints).toEqual({
      ocr: "https://example.test/ocr",
      jurisdictionCapabilities: "https://example.test/capabilities",
    });
    expect(config).not.toHaveProperty("VITE_SUPABASE_SERVICE_ROLE_KEY");
    expect(config).not.toHaveProperty("VITE_LLM_API_KEY");
  });
});
