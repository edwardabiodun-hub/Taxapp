import { db } from "./local-db";
import { getOrCreateDbKey } from "./encryption-key";
import { importAesKey, encryptBytes, decryptBytes } from "./crypto-primitives";

let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) keyPromise = getOrCreateDbKey().then(importAesKey);
  return keyPromise;
}

/**
 * Encrypts and durably persists an uploaded file's bytes, returning an id to
 * store alongside the file's metadata on a LocalDeclaration.documents entry.
 * Call this as soon as a file is selected, not at final form submission —
 * the previous implementation only ever persisted {name, size, type} and
 * discarded the actual bytes, so a user closing the app mid-wizard (or even
 * completing it) never had their uploaded documents actually saved anywhere.
 */
export async function saveDocumentFile(declarationId: string, file: File): Promise<string> {
  const key = await getKey();
  const bytes = await file.arrayBuffer();
  const { iv, ciphertext } = await encryptBytes(key, bytes);
  const id = crypto.randomUUID();

  await db.documentFiles.add({
    id,
    declarationId,
    name: file.name,
    size: file.size,
    type: file.type,
    iv,
    ciphertext,
    createdAt: new Date().toISOString(),
  });

  return id;
}

/** Retrieves and decrypts a previously saved document, or undefined if the id is unknown. */
export async function getDocumentFile(id: string): Promise<File | undefined> {
  const record = await db.documentFiles.get(id);
  if (!record) return undefined;

  const key = await getKey();
  const bytes = await decryptBytes(key, record.iv, record.ciphertext);
  return new File([bytes], record.name, { type: record.type });
}

export async function deleteDocumentFile(id: string): Promise<void> {
  await db.documentFiles.delete(id);
}
