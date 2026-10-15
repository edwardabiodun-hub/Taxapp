import { type EvidenceItem, isEvidenceSafe } from "./policy.ts";

export interface SearchResult {
  url: string;
  title: string;
  domain: string;
  publishedAt?: string;
  content?: string;
}

export interface SearchConfig {
  apiUrl: string;
  apiKey: string;
  apiAllowedHosts: string[];
  allowedDomains: string[];
  maxResults: number;
  maxBytes: number;
  timeoutMs: number;
  searchTransport?: PinnedSearchTransport;
  resolver?: (hostname: string) => Promise<string[]>;
}

export interface PinnedSearchRequest {
  url: string;
  publicIps: readonly string[];
  tlsHostname: string;
  method: "POST";
  redirect: "manual";
  headers: { authorization: string; "content-type": "application/json" };
  body: string;
  signal: AbortSignal;
}

/** Implementations must connect only to publicIps and verify TLS for tlsHostname. */
export interface PinnedSearchTransport {
  searchPinned(request: PinnedSearchRequest): Promise<Response>;
}

export interface TaxSearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

const MAX_BYTES = 100_000;
const MAX_RESULTS = 10;
const MAX_TIMEOUT_MS = 5_000;
const MAX_EXCERPT = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDomain(value: string): boolean {
  return value.length <= 253 && value.includes(".") && !value.endsWith(".") &&
    !/^[0-9.]+$/.test(value) &&
    value.split(".").every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
    ) &&
    !/(?:^|\.)(?:localhost|local|internal|lan|home|corp|intranet|localdomain|invalid)$/
      .test(value);
}

function isPublicIpv4(address: string): boolean {
  if (!/^(?:\d{1,3}\.){3}\d{1,3}$/.test(address)) return false;
  const parts = address.split(".").map(Number);
  if (parts.some((part) => part > 255)) return false;
  const [a, b, c, d] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 &&
      (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113) ||
    (a === 100 && b === 100 && c === 100 && d === 200) ||
    (a === 168 && b === 63 && c === 129 && d === 16));
}

function ipv6Parts(address: string): number[] | null {
  const withoutZone = address.replace(/^\[|\]$/g, "");
  if (withoutZone.includes("%")) return null;
  const mapped = withoutZone.match(/^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  let value = withoutZone;
  if (mapped) {
    const bytes = mapped[2].split(".").map(Number);
    if (bytes.some((byte) => byte > 255)) return null;
    value = `${mapped[1]}${((bytes[0] << 8) | bytes[1]).toString(16)}:${
      ((bytes[2] << 8) | bytes[3]).toString(16)
    }`;
  }
  if (!/^[0-9a-f:]+$/i.test(value) || value.split("::").length > 2) return null;
  const [left, right] = value.split("::");
  const first = left ? left.split(":") : [];
  const last = right ? right.split(":") : [];
  const missing = 8 - first.length - last.length;
  if (
    missing < (value.includes("::") ? 1 : 0) ||
    (!value.includes("::") && missing !== 0)
  ) return null;
  const parts = [...first, ...Array(missing).fill("0"), ...last];
  return parts.length === 8 &&
      parts.every((part) => /^[0-9a-f]{1,4}$/i.test(part))
    ? parts.map((part) => parseInt(part, 16))
    : null;
}

function isPublicAddress(address: string): boolean {
  if (address.includes(":")) {
    const parts = ipv6Parts(address);
    if (!parts) return false;
    // Native global unicast, excluding documented special-purpose/transition ranges.
    if ((parts[0] & 0xe000) !== 0x2000 || parts[0] === 0x2002) return false;
    if (parts[0] === 0x2001) {
      const second = parts[1];
      if (
        second <= 1 || second === 2 && parts[2] === 0 || second === 0x0db8 ||
        second >= 0x10 && second <= 0x2f
      ) return false;
    }
    return true;
  }
  return isPublicIpv4(address);
}

async function defaultResolver(hostname: string): Promise<string[]> {
  const [ipv4, ipv6] = await Promise.all([
    Deno.resolveDns(hostname, "A").catch(() => []),
    Deno.resolveDns(hostname, "AAAA").catch(() => []),
  ]);
  return [...ipv4, ...ipv6];
}

function parseSafeUrl(raw: string): URL | null {
  if (
    typeof raw !== "string" || raw.length > 2_048 ||
    // eslint-disable-next-line no-control-regex -- Reject C0/DEL bytes before URL parsing.
    /[\u0000-\u001f\u007f]/.test(raw)
  ) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" || url.username || url.password || url.port ||
    !isDomain(url.hostname.toLowerCase())
  ) return null;
  return url;
}

async function resolvePublicIps(
  url: URL,
  resolver: SearchConfig["resolver"],
): Promise<readonly string[] | null> {
  try {
    const addresses = await (resolver ?? defaultResolver)(url.hostname);
    if (
      !Array.isArray(addresses) || addresses.length === 0 ||
      !addresses.every((address) =>
        typeof address === "string" && isPublicAddress(address)
      )
    ) return null;
    return Object.freeze([...new Set(addresses)]);
  } catch {
    return null;
  }
}

async function validateTaxTarget(
  raw: string,
  allowedDomains: readonly string[],
  resolver?: SearchConfig["resolver"],
): Promise<{ url: URL; publicIps: readonly string[] } | null> {
  const url = parseSafeUrl(raw);
  if (!url || !Array.isArray(allowedDomains) || allowedDomains.length === 0) {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (
    !allowedDomains.some((domain) =>
      typeof domain === "string" && isDomain(domain.toLowerCase()) &&
      (host === domain.toLowerCase() ||
        host.endsWith(`.${domain.toLowerCase()}`))
    )
  ) return null;
  const publicIps = await resolvePublicIps(url, resolver);
  return publicIps ? { url, publicIps } : null;
}

export async function isAllowedTaxUrl(
  raw: string,
  allowedDomains: readonly string[],
  resolver?: SearchConfig["resolver"],
): Promise<boolean> {
  return (await validateTaxTarget(raw, allowedDomains, resolver)) !== null;
}

function validConfig(value: SearchConfig | undefined): value is SearchConfig {
  if (
    !isRecord(value) || "fetcher" in value || "pageTransport" in value ||
    "pageFetcher" in value ||
    "fetchPinned" in value
  ) return false;
  const endpoint = value && parseSafeUrl(value.apiUrl);
  if (
    !value || typeof value.apiKey !== "string" || !value.apiKey.trim() ||
    value.apiKey.length > 2_048 ||
    !endpoint || !Array.isArray(value.apiAllowedHosts) ||
    value.apiAllowedHosts.length === 0 || value.apiAllowedHosts.length > 20 ||
    !value.apiAllowedHosts.every((host) =>
      typeof host === "string" && host === host.toLowerCase() && isDomain(host)
    ) ||
    !value.apiAllowedHosts.includes(endpoint.hostname.toLowerCase()) ||
    !Array.isArray(value.allowedDomains) ||
    value.allowedDomains.length === 0 ||
    value.allowedDomains.length > 20 ||
    !value.allowedDomains.every((domain) =>
      typeof domain === "string" &&
      domain === domain.toLowerCase() && isDomain(domain)
    ) ||
    !Number.isSafeInteger(value.maxResults) || value.maxResults < 1 ||
    value.maxResults > MAX_RESULTS ||
    !Number.isSafeInteger(value.maxBytes) || value.maxBytes < 1 ||
    value.maxBytes > MAX_BYTES ||
    !Number.isSafeInteger(value.timeoutMs) || value.timeoutMs < 1 ||
    value.timeoutMs > MAX_TIMEOUT_MS
  ) return false;
  return true;
}

async function withDeadline<T>(
  operation: Promise<T>,
  controller: AbortController,
  deadline: number,
): Promise<T> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Timeout");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Timeout"));
        }, remaining);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function readBounded(
  response: Response,
  maxBytes: number,
  controller: AbortController,
  deadline: number,
): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await withDeadline(
        reader.read(),
        controller,
        deadline,
      );
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error("Response too large");
      chunks.push(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value.replace(
    /&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi,
    (match, entity: string) => {
      if (entity.startsWith("#")) {
        const code = entity[1]?.toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
        return code > 0 && code <= 0x10ffff &&
            !(code >= 0xd800 && code <= 0xdfff)
          ? String.fromCodePoint(code)
          : "";
      }
      return named[entity.toLowerCase()] ?? match;
    },
  );
}

function sanitizeContent(raw: string, html: boolean): string {
  const withoutActive = html
    ? raw
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(
        /<(script|style|noscript|template|svg|iframe|object|form)\b[^>]*>(?:[\s\S]*?<\/\1\s*>|[\s\S]*$)/gi,
        " ",
      )
      .replace(
        /<(script|style|noscript|template|svg|iframe|object|form)\b[^>]*$/gi,
        " ",
      )
      .replace(/<[^>]*>/g, " ")
    : raw;
  return decodeEntities(withoutActive).replace(/\s+/g, " ").trim().slice(
    0,
    MAX_EXCERPT,
  );
}

function parseResult(
  value: unknown,
  domains: readonly string[],
): SearchResult | null {
  if (
    !isRecord(value) || typeof value.url !== "string" ||
    typeof value.title !== "string" ||
    typeof value.domain !== "string" || !value.title.trim() ||
    value.title.length > 200 ||
    value.domain.length > 253 || (value.publishedAt !== undefined &&
      (typeof value.publishedAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value.publishedAt))) ||
    (value.content !== undefined &&
      (typeof value.content !== "string" ||
        value.content.length > MAX_EXCERPT)) ||
    (value.snippet !== undefined &&
      (typeof value.snippet !== "string" ||
        value.snippet.length > MAX_EXCERPT)) ||
    (value.snippets !== undefined &&
      (!Array.isArray(value.snippets) || value.snippets.length > 5 ||
        !value.snippets.every((snippet) =>
          typeof snippet === "string" && snippet.length <= MAX_EXCERPT
        )))
  ) return null;
  const url = parseSafeUrl(value.url);
  if (
    !url || value.domain.toLowerCase() !== url.hostname.toLowerCase() ||
    !domains.some((domain) =>
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    )
  ) return null;
  const content = value.content ?? value.snippet ??
    (Array.isArray(value.snippets) ? value.snippets.join(" ") : undefined);
  if (typeof content === "string" && content.length > MAX_EXCERPT) return null;
  return {
    url: url.href,
    title: value.title.trim(),
    domain: url.hostname.toLowerCase(),
    ...(value.publishedAt === undefined
      ? {}
      : { publishedAt: value.publishedAt }),
    ...(content === undefined ? {} : { content: content as string }),
  };
}

export function createTaxSearchProvider(
  config?: SearchConfig,
): TaxSearchProvider {
  if (
    !validConfig(config) ||
    typeof config.searchTransport?.searchPinned !== "function" ||
    (config.searchTransport.searchPinned as unknown) === globalThis.fetch ||
    "fetch" in config.searchTransport
  ) return { search: async () => [] };
  const safeConfig = Object.freeze({
    apiUrl: new URL(config.apiUrl).href,
    apiKey: config.apiKey,
    apiAllowedHosts: Object.freeze([...config.apiAllowedHosts]),
    allowedDomains: Object.freeze([...config.allowedDomains]),
    maxResults: config.maxResults,
    maxBytes: config.maxBytes,
    timeoutMs: config.timeoutMs,
    resolver: config.resolver,
    searchPinned: config.searchTransport.searchPinned.bind(
      config.searchTransport,
    ),
  });
  return {
    async search(query) {
      if (typeof query !== "string" || !query.trim() || query.length > 2_000) {
        return [];
      }
      const endpoint = parseSafeUrl(safeConfig.apiUrl);
      if (!endpoint) return [];
      const controller = new AbortController();
      const deadline = Date.now() + safeConfig.timeoutMs;
      try {
        if (
          !safeConfig.apiAllowedHosts.includes(endpoint.hostname.toLowerCase())
        ) return [];
        const publicIps = await withDeadline(
          resolvePublicIps(endpoint, safeConfig.resolver),
          controller,
          deadline,
        );
        if (!publicIps) return [];
        const response = await withDeadline(
          safeConfig.searchPinned({
            url: endpoint.href,
            publicIps,
            tlsHostname: endpoint.hostname,
            method: "POST",
            redirect: "manual",
            headers: {
              authorization: `Bearer ${safeConfig.apiKey}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              query: query.trim(),
              maxResults: safeConfig.maxResults,
            }),
            signal: controller.signal,
          }),
          controller,
          deadline,
        );
        if (
          !response.ok ||
          !/\bapplication\/json\b/i.test(
            response.headers.get("content-type") ?? "",
          )
        ) return [];
        const payload: unknown = JSON.parse(
          await readBounded(
            response,
            safeConfig.maxBytes,
            controller,
            deadline,
          ),
        );
        if (
          !isRecord(payload) || !Array.isArray(payload.results) ||
          payload.results.length > 50
        ) return [];
        const results: SearchResult[] = [];
        for (const entry of payload.results) {
          if (results.length >= safeConfig.maxResults) break;
          const parsed = parseResult(entry, safeConfig.allowedDomains);
          if (
            parsed &&
            await withDeadline(
              isAllowedTaxUrl(
                parsed.url,
                safeConfig.allowedDomains,
                safeConfig.resolver,
              ),
              controller,
              deadline,
            )
          ) {
            results.push(parsed);
          }
        }
        return results;
      } catch {
        return [];
      } finally {
        controller.abort();
      }
    },
  };
}

export async function fetchTaxEvidence(
  query: string,
  provider: TaxSearchProvider,
  config?: SearchConfig,
): Promise<EvidenceItem[]> {
  if (!validConfig(config)) return [];
  const controller = new AbortController();
  const deadline = Date.now() + config.timeoutMs;
  try {
    const results = await withDeadline(
      provider.search(query),
      controller,
      deadline,
    );
    if (!Array.isArray(results)) return [];
    const evidence: EvidenceItem[] = [];
    for (const result of results.slice(0, config.maxResults)) {
      if (Date.now() >= deadline) break;
      const parsed = parseResult(result, config.allowedDomains);
      if (!parsed || !parsed.content?.trim()) continue;
      let allowed: boolean;
      try {
        allowed = await withDeadline(
          isAllowedTaxUrl(parsed.url, config.allowedDomains, config.resolver),
          controller,
          deadline,
        );
      } catch {
        break;
      }
      if (!allowed) continue;
      const item: EvidenceItem = {
        sourceUrl: parsed.url,
        sourceTitle: parsed.title,
        domain: parsed.domain,
        ...(parsed.publishedAt === undefined
          ? {}
          : { publishedAt: parsed.publishedAt }),
        excerpt: sanitizeContent(parsed.content, true),
      };
      if (isEvidenceSafe(item)) evidence.push(item);
    }
    return evidence;
  } catch {
    return [];
  } finally {
    controller.abort();
  }
}
