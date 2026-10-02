import Dexie, { type Table } from "dexie";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import type { SubmissionEvent } from "@/domain/submissions";
import type { ExportMetadata } from "@/domain/exports";
import type {
  ReceiptFields,
  ReceiptProvenance,
  ReceiptReviewStatus,
  ConfirmedReceiptInput,
} from "@/domain/receipts";

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

export type ReceiptStatus = ReceiptReviewStatus;

export interface ReceiptExtractedData {
  vendorName?: string;
  receiptNumber?: string;
  receiptDate?: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface ReceiptRecord {
  id: string;
  preparationId: string;
  assetRef: string;
  fileName: string;
  mimeType: string;
  size: number;
  /** Legacy alias retained for older local records. New records use reviewStatus. */
  status?: ReceiptStatus;
  reviewStatus?: ReceiptReviewStatus;
  extractedData?: ReceiptExtractedData;
  fields?: ReceiptFields;
  originalFields?: ReceiptFields;
  correctionHistory?: Array<{
    field: keyof ReceiptFields;
    previousValue: string | null;
    correctedValue: string | null;
    at: string;
  }>;
  provenance?: ReceiptProvenance;
  calculationInput?: ConfirmedReceiptInput;
  errorMessage?: string;
  confirmedAt?: string;
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
  schemaVersion: string;
  jurisdiction: string;
  jurisdictionCode: string;
  taxYear: string;
  readiness: PreparationRecord["filingReadiness"];
  generatedAt: string;
  notSubmitted: true;
  source: string;
  sourceVerifiedAt: string;
  deadlineSource: string;
  deadlineVerifiedAt: string;
  metadata: ExportMetadata;
  createdAt: string;
}

export interface LocalReferenceData {
  key: string;
  value: unknown;
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
  meta?: Record<string, unknown>;
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
