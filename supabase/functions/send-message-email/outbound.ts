export const RESEND_ENDPOINT = "https://api.resend.com/emails";
export const OUTBOUND_TIMEOUT_MS = 5_000;
export const MAX_RESPONSE_BODY_BYTES = 16 * 1024;

export function validateAppUrl(value: string): string {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("APP_URL must be an HTTPS origin without credentials, path, query, or fragment");
  }

  return url.origin;
}

export function buildMessagesUrl(appUrl: string): string {
  const url = new URL("/messages", validateAppUrl(appUrl));
  return escapeHtml(url.toString());
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

export async function postToResend(
  headers: HeadersInit,
  body: BodyInit,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OUTBOUND_TIMEOUT_MS);

  try {
    return await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      redirect: "error",
      signal: controller.signal,
      headers,
      body,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function readResponseBodyLimited(
  response: Response,
  maxBytes = MAX_RESPONSE_BODY_BYTES,
  timeoutMs = OUTBOUND_TIMEOUT_MS,
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel();
    throw new Error("response body exceeds limit");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  const readBody = async (): Promise<string> => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new Error("response body exceeds limit");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new TextDecoder().decode(body);
  };

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      void reader.cancel();
      reject(new Error("response body timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([readBody(), timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
