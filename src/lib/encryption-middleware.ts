import Dexie, {
  type DBCoreMutateRequest,
  type DBCoreGetRequest,
  type DBCoreGetManyRequest,
  type DBCoreQueryRequest,
} from "dexie";
import { toBase64, fromBase64, importAesKey, encryptBytes, decryptBytes } from "./crypto-primitives";

const ENCRYPTED_PREFIX = "enc:v1:";

export interface EncryptionConfig {
  /** Table name -> list of non-indexed field names to encrypt. */
  [tableName: string]: string[];
}

async function encryptValue(key: CryptoKey, value: unknown): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const { iv, ciphertext } = await encryptBytes(key, plaintext.buffer);
  return `${ENCRYPTED_PREFIX}${toBase64(new Uint8Array(iv))}:${toBase64(new Uint8Array(ciphertext))}`;
}

async function decryptValue(key: CryptoKey, stored: string): Promise<unknown> {
  const [ivB64, ciphertextB64] = stored.slice(ENCRYPTED_PREFIX.length).split(":");
  const iv = fromBase64(ivB64);
  const ciphertext = fromBase64(ciphertextB64);
  const plaintext = await decryptBytes(key, iv.buffer, ciphertext.buffer);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function isEncryptedValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
}

type EncryptableRecord = Record<string, unknown>;

async function encryptObject<T extends EncryptableRecord>(
  key: CryptoKey,
  fields: string[],
  obj: T
): Promise<T> {
  if (obj == null) return obj;
  const result: EncryptableRecord = { ...obj };
  for (const field of fields) {
    if (result[field] === undefined || result[field] === null) continue;
    result[field] = await encryptValue(key, result[field]);
  }
  return result as T;
}

async function decryptObject<T extends EncryptableRecord>(
  key: CryptoKey,
  fields: string[],
  obj: T
): Promise<T> {
  if (obj == null) return obj;
  const result: EncryptableRecord = { ...obj };
  for (const field of fields) {
    if (isEncryptedValue(result[field])) {
      result[field] = await decryptValue(key, result[field]);
    }
  }
  return result as T;
}

/**
 * Applies field-level AES-256-GCM encryption to selected fields of selected
 * tables, using Dexie's DBCore ("dbcore" stack) middleware API. Indexed
 * fields must not be listed — they need to stay plaintext to remain
 * queryable, and this intentionally does not attempt searchable encryption.
 *
 * Known limitation: raw cursor iteration (Table.each(), or DBCore
 * openCursor() directly) on an encrypted table returns still-encrypted
 * field values. WebCrypto decryption is asynchronous, but Dexie's
 * cursor.value contract is synchronous, so it cannot be decrypted in that
 * path. Use get() / getMany() / toArray() / where(...).toArray(), all of
 * which are fully supported here — this codebase does not currently use
 * .each() or raw cursors on encrypted tables.
 */
export function applyFieldEncryption(
  db: Dexie,
  keySource: Uint8Array | Promise<Uint8Array>,
  config: EncryptionConfig
): void {
  const keyPromise = Promise.resolve(keySource).then(importAesKey);

  db.use({
    stack: "dbcore",
    name: "field-encryption",
    create(downlevelDatabase) {
      return {
        ...downlevelDatabase,
        table(tableName: string) {
          const downlevelTable = downlevelDatabase.table(tableName);
          const fields = config[tableName];
          if (!fields || fields.length === 0) return downlevelTable;

          return {
            ...downlevelTable,
            // Every step that touches a native (non-Dexie) Promise — the key
            // lookup and any crypto.subtle call — is wrapped in
            // Dexie.waitFor(). Without it, awaiting a native promise inside a
            // DBCore middleware silently drops Dexie's transaction context
            // (PSD), and the delegate call below fails with
            // "Cannot read properties of undefined (reading 'table')".
            mutate: async (req: DBCoreMutateRequest) => {
              if (req.type !== "add" && req.type !== "put") {
                return downlevelTable.mutate(req);
              }
              const key = await Dexie.waitFor(keyPromise);
              const values = await Dexie.waitFor(
                Promise.all(req.values.map((v) => encryptObject(key, fields, v)))
              );
              return downlevelTable.mutate({ ...req, values });
            },
            get: async (req: DBCoreGetRequest) => {
              const result = await downlevelTable.get(req);
              const key = await Dexie.waitFor(keyPromise);
              return Dexie.waitFor(decryptObject(key, fields, result));
            },
            getMany: async (req: DBCoreGetManyRequest) => {
              const results = await downlevelTable.getMany(req);
              const key = await Dexie.waitFor(keyPromise);
              return Dexie.waitFor(Promise.all(results.map((r) => decryptObject(key, fields, r))));
            },
            query: async (req: DBCoreQueryRequest) => {
              const res = await downlevelTable.query(req);
              if (req.values === false) return res;
              const key = await Dexie.waitFor(keyPromise);
              const result = await Dexie.waitFor(
                Promise.all(res.result.map((r) => decryptObject(key, fields, r)))
              );
              return { ...res, result };
            },
          };
        },
      };
    },
  });
}
