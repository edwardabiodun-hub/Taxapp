import { describe, expect, it } from "vitest";
import { getPublicRouteMetadata, getPublicSitemapEntries } from "./public-routes";

describe("public route smoke contract", () => {
  it("keeps every sitemap route uniquely addressable and described", () => {
    const entries = getPublicSitemapEntries();
    const paths = entries.map((entry) => entry.path);

    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.length).toBeGreaterThanOrEqual(14);

    for (const path of paths) {
      const metadata = getPublicRouteMetadata(path);
      expect(metadata?.title, path).toBeTruthy();
      expect(metadata?.description, path).toBeTruthy();
      expect(metadata?.path, path).toBe(path);
    }
  });

  it("keeps account, pricing, waitlist, and app routes outside the public sitemap", () => {
    const paths = getPublicSitemapEntries().map((entry) => entry.path);

    expect(paths).not.toContain("/create-account");
    expect(paths).not.toContain("/pricing");
    expect(paths).not.toContain("/filing-waitlist");
    expect(paths).not.toContain("/declare");
    expect(paths).not.toContain("/messages");
  });
});
