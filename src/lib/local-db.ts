import Dexie, { type Table } from "dexie";

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
  pendingSync: boolean;
}

export interface LocalReferenceData {
  key: string;
  value: any;
  lastSynced: string;
}

class TaxEaseDB extends Dexie {
  profiles!: Table<LocalProfile, string>;
  declarations!: Table<LocalDeclaration, string>;
  referenceData!: Table<LocalReferenceData, string>;

  constructor() {
    super("TaxEaseAfrica");
    this.version(2).stores({
      profiles: "id, email, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      referenceData: "key",
    });
  }
}

export const db = new TaxEaseDB();
