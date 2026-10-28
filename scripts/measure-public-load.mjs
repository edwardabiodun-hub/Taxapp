import { performance } from "node:perf_hooks";

const DEFAULT_ROUTES = ["/", "/calculator", "/filing-waitlist"];

function normalizeOrigin(value) {
  const url = new URL(String(value ?? "").trim());
  if (!/^https?:$/.test(url.protocol)) throw new Error("Load measurement requires an HTTP(S) origin.");
  return url.toString().replace(/\/$/, "");
}

function assetUrls(html, origin) {
  const values = [];
  const pattern = /<(?:script[^>]+src|link[^>]+(?:href))=["']([^"']+)["'][^>]*>/giu;
  for (const match of html.matchAll(pattern)) {
    const value = match[1];
    if (!value || value.startsWith("data:") || value.startsWith("mailto:")) continue;
    const url = new URL(value, `${origin}/`);
    if (url.origin === origin) values.push(url.toString());
  }
  return [...new Set(values)];
}

async function fetchMeasured(url, fetcher) {
  const started = performance.now();
  const response = await fetchSameOrigin(url, fetcher);
  const body = await response.arrayBuffer();
  return {
    url,
    status: response.status,
    bytes: body.byteLength,
    milliseconds: Math.round(performance.now() - started),
  };
}

async function fetchSameOrigin(url, fetcher) {
  const origin = new URL(url).origin;
  let currentUrl = url;

  for (let attempt = 0; attempt <= 3; attempt += 1) {
    const response = await fetcher(currentUrl, { cache: "no-store", redirect: "manual" });
    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400 && location;

    if (!isRedirect) return response;
    if (attempt === 3) throw new Error(`Too many redirects while measuring ${url}`);

    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.origin !== origin) {
      throw new Error(`Cross-origin redirect while measuring ${url}`);
    }
    currentUrl = nextUrl.href;
  }

  throw new Error(`Unreachable redirect evaluation while measuring ${url}`);
}

export async function measurePublicLoad(origin, routes = DEFAULT_ROUTES, fetcher = fetch) {
  const base = normalizeOrigin(origin);
  const results = [];

  for (const route of routes) {
    const page = await fetchMeasured(`${base}${route}`, fetcher);
    const htmlResponse = await fetchSameOrigin(`${base}${route}`, fetcher);
    const html = await htmlResponse.text();
    const assets = [];
    for (const assetUrl of assetUrls(html, base)) assets.push(await fetchMeasured(assetUrl, fetcher));
    results.push({
      route,
      page,
      assets,
      sameOriginAssetBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
    });
  }

  return { origin: base, routes: results };
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/measure-public-load.mjs")) {
  const origin = process.argv[2];
  if (!origin) {
    console.error("Usage: node scripts/measure-public-load.mjs http://127.0.0.1:4175");
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(await measurePublicLoad(origin), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
