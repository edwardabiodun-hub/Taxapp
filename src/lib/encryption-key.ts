import { SecureStorage } from "@aparajita/capacitor-secure-storage";
import { toBase64, fromBase64 } from "./crypto-primitives";

const KEY_STORAGE_NAME = "db-encryption-key";

let keyPromise: Promise<Uint8Array> | null = null;

/**
 * Returns the local database's AES-256 key, generating and persisting one on
 * first run via the platform's secure storage (iOS Keychain / Android
 * Keystore, through @aparajita/capacitor-secure-storage).
 *
 * Caveat: this plugin's web fallback (used when running in a plain browser
 * tab rather than a native Capacitor shell) is NOT hardware-backed — it has
 * no Keychain/Keystore to call into. The real security property only holds
 * on native iOS/Android builds; treat the web preview as functional parity
 * only, not a security guarantee.
 */
export function getOrCreateDbKey(): Promise<Uint8Array> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const existing = await SecureStorage.get(KEY_STORAGE_NAME).catch(() => null);
      if (typeof existing === "string" && existing.length > 0) {
        return fromBase64(existing);
      }
      const key = crypto.getRandomValues(new Uint8Array(32));
      await SecureStorage.set(KEY_STORAGE_NAME, toBase64(key));
      return key;
    })();
  }
  return keyPromise;
}
