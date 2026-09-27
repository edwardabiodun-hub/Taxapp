export interface RateLimitClient {
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: boolean | null; error: unknown }>;
}

export interface DualLimitInput {
  accountKey: string;
  ipKey: string;
  accountLimit: number;
  ipLimit: number;
  windowSeconds: number;
  salt: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashKey(salt: string, key: string): Promise<string> {
  const input = new TextEncoder().encode(`${salt}:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return toHex(new Uint8Array(digest));
}

/** Uses the trusted platform header and never accepts an arbitrary client value as a fallback. */
export function getTrustedClientIp(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) return cloudflareIp;

  const trustedProxyIp = request.headers.get("x-real-ip")?.trim();
  if (trustedProxyIp) return trustedProxyIp;

  return "unknown-client-ip";
}

export async function enforceDualLimit(
  client: RateLimitClient,
  input: DualLimitInput,
): Promise<{ allowed: boolean }> {
  const [accountHash, ipHash] = await Promise.all([
    hashKey(input.salt, `account:${input.accountKey}`),
    hashKey(input.salt, `ip:${input.ipKey}`),
  ]);

  const [accountResult, ipResult] = await Promise.all([
    client.rpc("consume_rate_limit", {
      p_key: accountHash,
      p_limit: input.accountLimit,
      p_window_seconds: input.windowSeconds,
    }),
    client.rpc("consume_rate_limit", {
      p_key: ipHash,
      p_limit: input.ipLimit,
      p_window_seconds: input.windowSeconds,
    }),
  ]);

  if (accountResult.error) throw accountResult.error;
  if (ipResult.error) throw ipResult.error;

  return { allowed: accountResult.data === true && ipResult.data === true };
}
