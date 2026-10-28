import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicRouteMetadata, getPublicSitemapEntries, renderPublicSitemap } from "./public-routes";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("public route metadata and sitemap", () => {
  it("defines metadata and a canonical path for every indexable public route", () => {
    const paths = ["/", "/learn", "/how-it-works", "/about", "/contact", "/privacy", "/terms", "/disclaimer", "/calculator", "/filing-directory"];

    for (const path of paths) {
      const metadata = getPublicRouteMetadata(path);
      expect(metadata, path).toBeDefined();
      expect(metadata?.title, path).toBeTruthy();
      expect(metadata?.description, path).toBeTruthy();
      expect(metadata?.path, path).toBe(path);
    }
  });

  it("includes published guides and the public calculator but excludes gated and app routes", () => {
    const entries = getPublicSitemapEntries();
    const paths = entries.map((entry) => entry.path);

    expect(paths).toContain("/calculator");
    expect(paths).toContain("/filing-directory");
    expect(paths).toContain("/learn/nigeria-tax-law-2026-personal-income-tax");
    expect(paths).not.toContain("/pricing");
    expect(paths).not.toContain("/create-account");
    expect(paths).not.toContain("/filing-waitlist");
    expect(paths).not.toContain("/declare");
  });

  it("renders valid XML with the configured origin and includes each sitemap entry once", () => {
    const xml = renderPublicSitemap("https://example.test");

    expect(xml).toContain("<loc>https://example.test/calculator</loc>");
    expect(xml).toContain("<loc>https://example.test/learn/nigeria-tax-law-2026-personal-income-tax</loc>");
    expect(xml.match(/<loc>https:\/\/example\.test\/calculator<\/loc>/g)).toHaveLength(1);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it("does not advertise private or gated routes as public metadata", () => {
    expect(getPublicRouteMetadata("/pricing")).toBeUndefined();
    expect(getPublicRouteMetadata("/create-account")).toBeUndefined();
    expect(getPublicRouteMetadata("/messages")).toBeUndefined();
  });

  it("keeps the public calculator crawlable and returns a 404 for unknown routes", () => {
    const robots = fs.readFileSync(path.join(projectRoot, "public/robots.txt"), "utf8");
    const redirects = fs.readFileSync(path.join(projectRoot, "public/_redirects"), "utf8");

    expect(robots).not.toMatch(/^Disallow:\s*\/calculator\s*$/m);
    expect(redirects).toContain("/pricing /index.html 200");
    // Cloudflare Pages serves a top-level 404.html natively. Its _redirects
    // parser does not support 404 rewrites, so a catch-all rule here would
    // turn unknown paths into a non-404 response.
    expect(redirects).not.toContain("/* /404.html 404");
  });
});
