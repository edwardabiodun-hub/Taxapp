import { getTrustedClientIp } from "../_shared/rate-limit.ts";

export type ContactMessage = { name: string; email: string; subject: string; message: string };
type ContactRequest = ContactMessage & { website: string };

export type ContactMessageHandlerDependencies = {
  appOrigin: string;
  checkRateLimit: (email: string, ip: string) => Promise<boolean>;
  sendEmail: (message: ContactMessage) => Promise<void>;
};

const allowedHeaders = new Set(["authorization", "apikey", "content-type", "x-client-info"]);
const maxBodyBytes = 8_192;
const genericSuccess = { ok: true };

export const selectContactOrigin = (contactOrigin: string | undefined, appOrigin: string): string =>
  contactOrigin?.trim() || appOrigin;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validText(value: unknown, minLength: number, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length >= minLength && value.trim().length <= maxLength;
}

function parseContactRequest(value: unknown): ContactRequest | null {
  if (!isRecord(value) || Object.keys(value).length !== 5
    || !["name", "email", "subject", "message", "website"].every((key) => Object.prototype.hasOwnProperty.call(value, key))) return null;
  if (!validText(value.name, 1, 100) || !validText(value.email, 3, 254)
    || !validText(value.subject, 2, 120) || !validText(value.message, 10, 4_000)
    || typeof value.website !== "string" || value.website.length > 300) return null;

  const email = value.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    name: value.name.trim(),
    email,
    subject: value.subject.trim().replace(/[\r\n]+/g, " "),
    message: value.message.trim(),
    website: value.website.trim(),
  };
}

async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body");
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > maxBodyBytes) {
      await reader.cancel();
      throw new Error("Request body too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function jsonResponse(status: number, body: Record<string, unknown>, origin?: string): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    vary: "Origin",
  });
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "authorization, apikey, content-type, x-client-info");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function allowedPreflight(request: Request, origin: string): boolean {
  if (request.headers.get("origin") !== origin
    || request.headers.get("access-control-request-method") !== "POST") return false;
  const requestedHeaders = request.headers.get("access-control-request-headers");
  if (!requestedHeaders) return true;
  return requestedHeaders.split(",").map((header) => header.trim().toLowerCase())
    .every((header) => allowedHeaders.has(header));
}

export function createContactMessageHandler(dependencies: ContactMessageHandlerDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      return allowedPreflight(request, dependencies.appOrigin)
        ? new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": dependencies.appOrigin,
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
            "access-control-max-age": "600",
            "cache-control": "no-store",
            vary: "Origin",
          },
        })
        : jsonResponse(403, { error: "forbidden" });
    }
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS", "cache-control": "no-store" } });
    }
    if (origin !== dependencies.appOrigin) return jsonResponse(403, { error: "forbidden" });
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return jsonResponse(415, { error: "unsupported_media_type" }, origin);
    }

    let submission: ContactRequest | null;
    try {
      submission = parseContactRequest(await readJson(request));
    } catch {
      return jsonResponse(400, { error: "invalid_request" }, origin);
    }
    if (!submission) return jsonResponse(400, { error: "invalid_request" }, origin);
    if (submission.website) return jsonResponse(200, genericSuccess, origin);

    let allowed: boolean;
    try {
      allowed = await dependencies.checkRateLimit(submission.email.toLowerCase(), getTrustedClientIp(request));
    } catch {
      return jsonResponse(503, { error: "temporarily_unavailable" }, origin);
    }
    if (!allowed) return jsonResponse(429, { error: "rate_limited" }, origin);

    try {
      const { website: _website, ...message } = submission;
      await dependencies.sendEmail(message);
      return jsonResponse(200, genericSuccess, origin);
    } catch {
      return jsonResponse(502, { error: "delivery_failed" }, origin);
    }
  };
}
