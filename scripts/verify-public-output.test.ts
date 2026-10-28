import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { verifyPublicOutput } from "./verify-public-output";

async function createPublicFixture(options: {
  readonly pageCount: number;
  readonly include404?: boolean;
  readonly includeNoIndexPage?: boolean;
  readonly missingH1?: boolean;
  readonly missingCanonical?: boolean;
}): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "filesmart-public-output-"));
  for (let index = 0; index < options.pageCount; index += 1) {
    const pageRoot = index === 0 ? root : path.join(root, `page-${index}`);
    await mkdir(pageRoot, { recursive: true });
    await writeFile(
      path.join(pageRoot, "index.html"),
      `<!doctype html><html><head>${options.missingCanonical ? "" : '<link rel="canonical" href="https://example.test/" />'}</head><body>${options.missingH1 ? "" : "<h1>Public page</h1>"}</body></html>`,
      "utf8",
    );
  }
  await writeFile(
    path.join(root, "sitemap.xml"),
    Array.from({ length: options.pageCount }, (_, index) => `<loc>https://example.test/${index}</loc>`).join("\n"),
    "utf8",
  );
  if (options.includeNoIndexPage) {
    const noIndexRoot = path.join(root, "filing-waitlist");
    await mkdir(noIndexRoot, { recursive: true });
    await writeFile(
      path.join(noIndexRoot, "index.html"),
      '<!doctype html><html><head><meta name="robots" content="noindex, nofollow" /></head><body><h1>Waitlist</h1></body></html>',
      "utf8",
    );
  }
  if (options.include404 !== false) {
    await writeFile(path.join(root, "404.html"), "<!doctype html>", "utf8");
  }
  return root;
}

describe("public output verification", () => {
  it("accepts a complete prerendered output", async () => {
    const root = await createPublicFixture({ pageCount: 14 });

    await expect(verifyPublicOutput(root)).resolves.toMatchObject({
      htmlCount: 14,
      missingH1: [],
      missingCanonical: [],
      sitemapUrlCount: 14,
      has404: true,
    });
  });

  it("reports missing crawlability and fallback artifacts", async () => {
    const root = await createPublicFixture({
      pageCount: 1,
      include404: false,
      missingH1: true,
      missingCanonical: true,
    });

    await expect(verifyPublicOutput(root)).resolves.toMatchObject({
      htmlCount: 1,
      missingH1: ["index.html"],
      missingCanonical: ["index.html"],
      sitemapUrlCount: 1,
      has404: false,
    });
  });

  it("allows gated noindex pages outside the sitemap", async () => {
    const root = await createPublicFixture({ pageCount: 1, includeNoIndexPage: true });

    await expect(verifyPublicOutput(root)).resolves.toMatchObject({
      htmlCount: 2,
      crawlableHtmlCount: 1,
      missingH1: [],
      missingCanonical: [],
      sitemapUrlCount: 1,
      has404: true,
    });
  });
});
