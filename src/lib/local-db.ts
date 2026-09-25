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
  /** Set when the user requested account deletion but at least one linked
   * declaration was still under its NTAA retention hold, so the profile
   * was pseudonymized (name/phone/etc. cleared) rather than removed — see
   * account-deletion.ts and api.ts's pseudonymizeProfileOnServer(). */
  pseudonymizedAt?: string;
}

export interface LocalDeclaration {
  id: string;
  taxYear: string;
  country: string;
  /** State of residence for this filing (Nigerian states only today, e.g.
   * "lagos") -- a per-filing fact, not a profile attribute, since state of
   * residence as of Jan 1 determines which SIRS a filer files with and can
   * change between tax years. Absent on declarations created before this
   * field existed, or when country !== "ng"; calculateStateTax() and
   * stateName() both treat a missing/unrecognized value as "no state
   * selected" rather than an error. */
  state?: string;
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
  /** 1 = written locally and not yet pushed to the server; 0 = synced (or
   * pulled from the server, where it's already authoritative). See
   * activity-log.ts and sync-service.ts's syncAll(). */
  pendingSync?: 0 | 1;
}

export interface LocalMessage {
  id: string;
  /** References a declarations row — absent for a general, non-filing
   * message. Set null server-side (not deleted) if the linked declaration
   * is later removed; see the messages migration's `on delete set null`. */
  declarationId?: string;
  category: "refund_status" | "document_request" | "general";
  subject: string;
  body: string;
  /** ISO timestamp of when the recipient opened this message; undefined
   * means unread. Never cleared once set — "un-reading" a message isn't
   * supported. */
  readAt?: string;
  createdAt: string;
  /** 0 | 1, not boolean — see LocalDeclaration.pendingSync for why this
   * codebase always uses 0/1 for an IndexedDB-indexed flag. 0 until the
   * user marks the message read locally; set to 1 at that point so
   * sync-service pushes just the read_at change, then cleared back to 0
   * once pushed. */
  pendingSync: 0 | 1;
}

class TaxEaseDB extends Dexie {
  profiles!: Table<LocalProfile, string>;
  declarations!: Table<LocalDeclaration, string>;
  documentFiles!: Table<LocalDocumentFile, string>;
  referenceData!: Table<LocalReferenceData, string>;
  activities!: Table<LocalActivity, string>;
  messages!: Table<LocalMessage, string>;

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
      messages: ["subject", "body"],
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

    // v6 -> v7: dropped `auth` — the local PBKDF2 login gate was superseded
    // by real Supabase Auth once a backend existed (see auth.ts). Anyone
    // who onboarded on v6 will need to sign up again; there are no
    // production users on v6 yet.
    this.version(7).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      auth: null,
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });

    // v7 -> v8: added `pendingSync` to activities, so locally-recorded
    // activities (declaration creation, document upload) can actually be
    // pushed to the server — previously the activities table existed on
    // both ends but nothing in api.ts ever wrote to it, so it only ever
    // held whatever the pull side wrote after fetching from the server.
    this.version(8).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      auth: null,
      referenceData: "key",
      activities: "id, declarationId, timestamp, pendingSync",
    });

    // v8 -> v9: added `messages` — admin-to-user notifications (refund
    // status updates, requests for additional documents), pulled from the
    // server; see api.ts's fetchMessagesFromServer/pushMessageReadStatus
    // and sync-service.ts. `readAt` isn't indexed (see the LocalMessage
    // doc comment) — the unread count filters the table directly instead.
    this.version(9).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      auth: null,
      referenceData: "key",
      activities: "id, declarationId, timestamp, pendingSync",
      messages: "id, declarationId, pendingSync, createdAt",
    });
  }
}

export const db = new TaxEaseDB();
