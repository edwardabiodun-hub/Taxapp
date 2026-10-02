export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
}

const IV_LENGTH_BYTES = 12;

export interface EncryptedBytes {
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
}

/** Encrypts raw bytes with AES-256-GCM under a fresh random IV. */
export async function encryptBytes(key: CryptoKey, data: ArrayBuffer): Promise<EncryptedBytes> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: iv.buffer, ciphertext };
}

/** Decrypts bytes produced by encryptBytes(). Throws on wrong key or tampered ciphertext (GCM auth tag). */
export function decryptBytes(key: CryptoKey, iv: ArrayBuffer, ciphertext: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}
