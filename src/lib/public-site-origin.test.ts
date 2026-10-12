import { describe, expect, it } from "vitest";
import { resolvePublicSiteOrigin } from "./public-site-origin";

describe("resolvePublicSiteOrigin", () => {
  it("uses the configured origin and strips trailing slashes", () => {
    expect(resolvePublicSiteOrigin("https://example.test///")).toBe("https://example.test");
  });

  it("falls back to the approved demo origin when configuration is absent", () => {
    expect(resolvePublicSiteOrigin()).toBe("https://filesmart-demo.netlify.app");
  });
});
