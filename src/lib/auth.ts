import { db } from "./local-db";
import { toBase64, fromBase64 } from "./crypto-primitives";

// OWASP-recommended minimum for PBKDF2-HMAC-SHA256 (2023 guidance).
const PBKDF2_ITERATIONS = 210_000;
const SALT_LENGTH_BYTES = 16;
const AUTH_RECORD_ID = "primary";

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toBase64(new Uint8Array(bits));
}

/** Constant-time-ish string comparison to avoid leaking hash length/content via early-exit timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hasAccount(): Promise<boolean> {
  const record = await db.auth.get(AUTH_RECORD_ID);
  return record !== undefined;
}

/** Creates (or replaces) the single local login credential. Login-gate only
 * — does not affect the data-at-rest encryption key (see local-db.ts). */
export async function createAccount(email: string, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
  const passwordHash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);

  await db.auth.put({
    id: AUTH_RECORD_ID,
    email: email.trim().toLowerCase(),
    passwordHash,
    salt: toBase64(salt),
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  });
}

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const record = await db.auth.get(AUTH_RECORD_ID);
  if (!record) return false;
  if (record.email !== email.trim().toLowerCase()) return false;

  const candidateHash = await derivePasswordHash(password, fromBase64(record.salt), record.iterations);
  return timingSafeEqual(candidateHash, record.passwordHash);
}
