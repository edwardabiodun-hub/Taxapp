export interface PendingLaunchWaitlistEntry {
  id: string;
  email: string;
  name: string | null;
}

export interface LaunchNotifierDependencies {
  secret: string;
  listPending: (limit: number) => Promise<PendingLaunchWaitlistEntry[]>;
  sendEmail: (entry: PendingLaunchWaitlistEntry) => Promise<void>;
  markNotified: (id: string) => Promise<void>;
}

const MAX_BATCH_SIZE = 50;
const DEFAULT_BATCH_SIZE = 25;
const encoder = new TextEncoder();

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0 && left.length === right.length;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function requestedBatchSize(body: unknown): number {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return DEFAULT_BATCH_SIZE;
  const value = (body as { batchSize?: unknown }).batchSize;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(value, MAX_BATCH_SIZE);
}

export function createLaunchNotifierHandler(dependencies: LaunchNotifierDependencies) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { allow: "POST", "cache-control": "no-store" } });
    }
    if (request.headers.has("origin")) return jsonResponse({ error: "forbidden" }, 403);

    const authorization = request.headers.get("authorization") ?? "";
    const suppliedSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!suppliedSecret || !await constantTimeEqual(suppliedSecret, dependencies.secret)) {
      return jsonResponse({ error: "unauthorized" }, 401);
    }

    let body: unknown = {};
    if (request.headers.get("content-length") !== "0") {
      try {
        const rawBody = await request.text();
        if (rawBody.length > 1_000) return jsonResponse({ error: "invalid_request" }, 400);
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        return jsonResponse({ error: "invalid_request" }, 400);
      }
    }

    let entries: PendingLaunchWaitlistEntry[];
    try {
      entries = await dependencies.listPending(requestedBatchSize(body));
    } catch {
      return jsonResponse({ error: "queue_unavailable" }, 500);
    }

    let sent = 0;
    let failed = 0;
    for (const entry of entries) {
      try {
        await dependencies.sendEmail(entry);
        await dependencies.markNotified(entry.id);
        sent += 1;
      } catch {
        // Keep the record pending for a later retry. No recipient data is returned or logged.
        failed += 1;
      }
    }

    return jsonResponse({ processed: entries.length, sent, failed });
  };
}
