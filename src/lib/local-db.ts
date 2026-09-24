import Dexie, { type Table } from "dexie";
import { applyFieldEncryption } from "./encryption-middleware";
import { getOrCreateDbKey } from "./encryption-key";

export interface LocalProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  country: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  gender?: string;
  nationality?: string;
  lastSynced?: string;
  /** ISO timestamp of when the user accepted the privacy notice at
   * onboarding — an auditable consent record, not just a UI checkbox. */
  consentAcceptedAt?: string;
}

export interface LocalDeclaration {
  id: string;
  taxYear: string;
  country: string;
  type: string;
  status: "draft" | "submitted" | "processing" | "audit_request" | "approved";
  formData: Record<string, string>;
  /** `id` (when present) references a row in the documentFiles table holding
   * the actual encrypted bytes — see document-storage.ts. Declarations
   * created before that table existed may have entries with no `id`. */
  documents: { id?: string; name: string; size: number; type: string }[];
  amount?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  /**
   * 0 | 1, not boolean: this field is IndexedDB-indexed (see stores() below),
   * and boolean is not a valid IndexedDB key type — a boolean value here is
   * silently never added to the index, so `.where("pendingSync").equals(...)`
   * would never match a single record. Always write 0 or 1.
   */
  pendingSync: 0 | 1;
}

/**
 * Holds the actual encrypted bytes of an uploaded document. Kept in a
 * separate table from LocalDeclaration.documents (which stays metadata-only)
 * because this table's `ciphertext`/`iv` are encrypted directly by
 * document-storage.ts (raw AES-GCM bytes) rather than through
 * applyFieldEncryption, which encrypts JSON-stringifiable field values —
 * not a natural fit for binary file content.
 */
export interface LocalDocumentFile {
  id: string;
  declarationId: string;
  name: string;
  size: number;
  type: string;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
  createdAt: string;
}

/**
 * A single local account credential (login-gate only — see auth.ts). This
 * does NOT protect data at rest: the passwordHash isn't derivable back into
 * anything, so it isn't added to applyFieldEncryption's config. The
 * encryption key from encryption-key.ts is independent of this password by
 * deliberate choice (see PR discussion) — a forgotten password resets this
 * table, not the encrypted tax data underneath.
 */
export interface LocalAuth {
  id: "primary";
  email: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: string;
}

export interface LocalReferenceData {
  key: string;
  value: any;
  lastSynced: string;
}

export type ActivityType = "status_change" | "document_upload" | "created" | "note";

export interface LocalActivity {
  id: string;
  declarationId: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  meta?: Record<string, any>;
}

class TaxEaseDB extends Dexie {
  profiles!: Table<LocalProfile, string>;
  declarations!: Table<LocalDeclaration, string>;
  documentFiles!: Table<LocalDocumentFile, string>;
  auth!: Table<LocalAuth, string>;
  referenceData!: Table<LocalReferenceData, string>;
  activities!: Table<LocalActivity, string>;

  constructor() {
    super("TaxEaseAfrica");

    // PII and financial fields are encrypted at rest with a device-held
    // AES-256 key (see encryption-key.ts). Encrypted fields cannot also be
    // indexed, so `email` was dropped from the profiles index below — nothing
    // in the app queries profiles by email today.
    applyFieldEncryption(this, getOrCreateDbKey(), {
      profiles: [
        "name",
        "email",
        "phone",
        "taxId",
        "dateOfBirth",
        "countryOfBirth",
        "gender",
        "nationality",
      ],
      declarations: ["formData", "amount"],
    });

    // v3 -> v4: dropped the `email` index from profiles so it can be
    // encrypted (see above). Anyone with existing local test data from
    // before this change will need to clear app storage once; there are no
    // production users on v3 yet.
    this.version(4).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });

    // v4 -> v5: added documentFiles, so uploaded document bytes are actually
    // persisted (encrypted) instead of being discarded after the in-memory
    // File object goes away — see document-storage.ts.
    this.version(5).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });

    // v5 -> v6: added `auth` — a single local login credential (see auth.ts).
    this.version(6).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      auth: "id",
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });
  }
}

export const db = new TaxEaseDB();
