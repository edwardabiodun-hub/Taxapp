import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("public route redirects", () => {
  it("does not rewrite direct create-account requests to the homepage", async () => {
    const redirects = await readFile(path.resolve(process.cwd(), "public/_redirects"), "utf8");

    expect(redirects).not.toMatch(/^\/create-account\s+\/index\.html\s+200\s*$/m);
  });
});
