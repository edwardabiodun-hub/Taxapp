import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath));
    } else {
      files.push(absolutePath);
    }
  }

  return files;
}

function relativeName(root, filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

export async function verifyPublicOutput(root) {
  const files = await listFiles(root);
  const htmlFiles = files.filter((filePath) => path.basename(filePath) === "index.html");
  const missingH1 = [];
  const missingCanonical = [];
  let crawlableHtmlCount = 0;

  for (const filePath of htmlFiles) {
    const html = await readFile(filePath, "utf8");
    const name = relativeName(root, filePath);
    const noIndex = /<meta\b(?=[^>]*\bname=["']robots["'])(?=[^>]*\bcontent=["'][^"']*\bnoindex\b)[^>]*>/i.test(html);
    if (!/<h1\b/i.test(html)) missingH1.push(name);
    if (!noIndex) {
      crawlableHtmlCount += 1;
      if (!/rel=["']canonical["']/i.test(html)) missingCanonical.push(name);
    }
  }

  const sitemapPath = path.join(root, "sitemap.xml");
  const sitemap = await readFile(sitemapPath, "utf8");

  return {
    htmlCount: htmlFiles.length,
    crawlableHtmlCount,
    missingH1,
    missingCanonical,
    sitemapUrlCount: (sitemap.match(/<loc>/g) ?? []).length,
    has404: files.includes(path.join(root, "404.html")),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? "dist-public");
  const result = await verifyPublicOutput(root);
  const errors = [];

  if (result.htmlCount < 14) errors.push(`expected at least 14 prerendered pages, found ${result.htmlCount}`);
  if (result.missingH1.length > 0) errors.push(`missing h1: ${result.missingH1.join(", ")}`);
  if (result.missingCanonical.length > 0) errors.push(`missing canonical: ${result.missingCanonical.join(", ")}`);
  if (result.sitemapUrlCount !== result.crawlableHtmlCount) errors.push(`sitemap/page mismatch: ${result.sitemapUrlCount} sitemap URLs for ${result.crawlableHtmlCount} crawlable pages`);
  if (!result.has404) errors.push("missing 404.html");

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(result));
  }
}
