import Dexie, { type Table } from "dexie";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import type { SubmissionEvent } from "@/domain/submissions";

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
  /** Optional evidence carried by an older integration; absence is not confirmation. */
  authorityReference?: string;
  authorityConfirmedAt?: string;
  authorityConfirmation?: {
    authorityReference: string;
    confirmedAt: string;
  };
}

export type StoredPreparation = PreparationRecord & {
  pendingSync: boolean;
  syncedAt?: string;
};

export interface DeadlineRecord {
  id: string;
  jurisdictionCode: string;
  taxYear: string;
  dueAt: string;
  sourceKind: "verified_state" | "national_baseline" | "unverified";
  source?: string;
  updatedAt: string;
}

export type ReceiptStatus = "needs_review" | "confirmed" | "rejected";

export interface ReceiptRecord {
  id: string;
  preparationId: string;
  assetRef: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: ReceiptStatus;
  extractedData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ExportPackageRecord {
  id: string;
  preparationId: string;
  format: "pdf" | "csv" | "xlsx";
  assetRef: string;
  ruleProfileVersion: string;
  calculationLabel: PreparationRecord["calculationLabel"];
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
  preparations!: Table<StoredPreparation, string>;
  jurisdictionCapabilities!: Table<JurisdictionCapability, string>;
  deadlines!: Table<DeadlineRecord, string>;
  receiptRecords!: Table<ReceiptRecord, string>;
  exportPackages!: Table<ExportPackageRecord, string>;
  submissionEvents!: Table<SubmissionEvent, string>;
  referenceData!: Table<LocalReferenceData, string>;
  activities!: Table<LocalActivity, string>;

  constructor() {
    super("TaxEaseAfrica");
    this.version(3).stores({
      profiles: "id, email, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });
    this.version(4).stores({
      profiles: "id, email, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      preparations: "id, jurisdictionCode, taxYear, status, pendingSync, createdAt, updatedAt",
      jurisdictionCapabilities: "jurisdictionCode, countryCode, primaryReadiness, registryVersion",
      deadlines: "id, jurisdictionCode, taxYear, dueAt, sourceKind, updatedAt",
      receiptRecords: "id, preparationId, status, createdAt, updatedAt",
      exportPackages: "id, preparationId, format, createdAt",
      submissionEvents: "id, preparationId, type, actor, timestamp",
      referenceData: "key",
      activities: "id, declarationId, timestamp",
    });
  }
}

export const db = new TaxEaseDB();
