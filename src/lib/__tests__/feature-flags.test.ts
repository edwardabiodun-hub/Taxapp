import { describe, expect, it } from "vitest";
import { resolveFeatureFlags } from "@/lib/feature-flags";
import { getPublicRuntimeConfig } from "@/lib/runtime-config";
import { loadJurisdictionCapabilities } from "@/lib/jurisdiction-service";

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
