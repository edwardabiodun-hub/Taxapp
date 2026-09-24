import { describe, it, expect } from "vitest";
import { importAesKey, encryptBytes, decryptBytes } from "./crypto-primitives";

function randomKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

describe("crypto-primitives", () => {
  it("round-trips arbitrary bytes through encrypt/decrypt", async () => {
    const key = await importAesKey(randomKey());
    const original = crypto.getRandomValues(new Uint8Array(2048)).buffer;

    const { iv, ciphertext } = await encryptBytes(key, original);
    const decrypted = await decryptBytes(key, iv, ciphertext);

    expect(new Uint8Array(decrypted)).toEqual(new Uint8Array(original));
  });

  it("produces a different IV and ciphertext on each call (no key/IV reuse)", async () => {
    const key = await importAesKey(randomKey());
    const data = new TextEncoder().encode("same plaintext").buffer;

    const first = await encryptBytes(key, data);
    const second = await encryptBytes(key, data);

    expect(new Uint8Array(first.iv)).not.toEqual(new Uint8Array(second.iv));
    expect(new Uint8Array(first.ciphertext)).not.toEqual(new Uint8Array(second.ciphertext));
  });

  it("fails to decrypt with the wrong key", async () => {
    const key = await importAesKey(randomKey());
    const wrongKey = await importAesKey(randomKey());
    const { iv, ciphertext } = await encryptBytes(key, new TextEncoder().encode("secret").buffer);

    await expect(decryptBytes(wrongKey, iv, ciphertext)).rejects.toThrow();
  });

  it("fails to decrypt tampered ciphertext", async () => {
    const key = await importAesKey(randomKey());
    const { iv, ciphertext } = await encryptBytes(key, new TextEncoder().encode("secret").buffer);
    const tampered = new Uint8Array(ciphertext);
    tampered[0] ^= 0xff;

    await expect(decryptBytes(key, iv, tampered.buffer)).rejects.toThrow();
  });
});
