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
}

export interface LocalDeclaration {
  id: string;
  taxYear: string;
  country: string;
  type: string;
  status: "draft" | "submitted" | "processing" | "audit_request" | "approved";
  formData: Record<string, string>;
  documents: { name: string; size: number; type: string }[];
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
  }
}

export const db = new TaxEaseDB();
