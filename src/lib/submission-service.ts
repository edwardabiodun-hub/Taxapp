import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { ExportPackageRecord } from "@/lib/local-db";
import type { PreparationRecord } from "@/domain/preparations";
import {
  isUserSubmissionEvidenceValid,
  type SubmissionEvent,
  type UserSubmissionEvidence,
} from "@/domain/submissions";
import { persistExportMetadata } from "@/lib/exports/export-service";
import type { ExportPersistence } from "@/lib/exports/export-service";
import { saveExportPackage } from "@/lib/export-repository";
import {
  appendSubmissionEvent,
  getPreparation,
  savePreparation,
} from "@/lib/preparation-repository";
import {
  UniversalExportAdapter,
  universalExportAdapter,
} from "@/lib/submission-adapters/universal-export-adapter";
import type { SubmissionAdapter } from "@/lib/submission-adapters/submission-adapter";

export interface SubmissionRepository {
  readonly getPreparation: (id: string) => Promise<PreparationRecord | undefined>;
  readonly savePreparation: (preparation: PreparationRecord) => Promise<void>;
  readonly appendSubmissionEvent: (event: SubmissionEvent) => Promise<void>;
}

export interface SubmissionServiceOptions {
  readonly repository?: SubmissionRepository;
  readonly adapter?: SubmissionAdapter;
  readonly now?: () => string;
  readonly exportPersistence?: ExportPersistence;
}

const defaultRepository: SubmissionRepository = {
  getPreparation,
  savePreparation,
  appendSubmissionEvent,
};

export class SubmissionService {
  private readonly repository: SubmissionRepository;
  private readonly adapter: SubmissionAdapter;
  private readonly now: () => string;
  private readonly exportPersistence: ExportPersistence;

  constructor(options: SubmissionServiceOptions = {}) {
    this.repository = options.repository ?? defaultRepository;
    this.adapter = options.adapter ?? universalExportAdapter;
    this.now = options.now ?? (() => new Date().toISOString());
    this.exportPersistence = options.exportPersistence ?? {
      saveExportPackage,
      savePreparation: this.repository.savePreparation,
    };
  }

  async export(preparationId: string) {
    const preparation = await this.requirePreparation(preparationId);
    assertExportableStatus(preparation);
    const capability = getJurisdictionCapability(preparation.jurisdictionCode);
    const submissionPackage = await this.adapter.prepare(preparation, capability);

    await persistExportMetadata(
      submissionPackage.exportPackage,
      preparation,
      this.exportPersistence,
    );
    await this.repository.appendSubmissionEvent({
      id: createEventId(preparationId, "exported"),
      preparationId,
      type: "exported",
      actor: "system",
      timestamp: submissionPackage.exportPackage.generatedAt,
    });

    return submissionPackage.exportPackage;
  }

  async markUserSubmitted(
    preparationId: string,
    evidence: UserSubmissionEvidence,
  ): Promise<void> {
    const preparation = await this.requirePreparation(preparationId);
    if (preparation.status !== "exported") {
      throw new Error(
        `User submission requires an exported preparation; current status is ${preparation.status}.`,
      );
    }

    const normalizedEvidence = normalizeUserEvidence(evidence, this.now());
    const timestamp = normalizedEvidence.submittedAt ?? this.now();
    const next = {
      ...preparation,
      status: "user_submitted" as const,
      updatedAt: timestamp,
    };
    await this.repository.savePreparation(next);
    await this.repository.appendSubmissionEvent({
      id: createEventId(preparationId, "user_submitted"),
      preparationId,
      type: "user_submitted",
      actor: "user",
      timestamp,
      userEvidence: normalizedEvidence,
    });
  }

  async confirmAuthority(
    preparationId: string,
    authorityReference: string,
  ): Promise<void> {
    const reference = normalizeAuthorityReference(authorityReference);
    const preparation = await this.requirePreparation(preparationId);

    if (preparation.status === "authority_confirmed") {
      if (preparation.authorityConfirmation.authorityReference === reference) return;
      throw new Error("An authority-confirmed preparation cannot be replaced.");
    }
    if (preparation.status !== "user_submitted") {
      throw new Error(
        `Authority confirmation requires user submission; current status is ${preparation.status}.`,
      );
    }

    const confirmedAt = this.now();
    const next: PreparationRecord = {
      ...preparation,
      status: "authority_confirmed",
      authorityConfirmation: {
        authorityReference: reference,
        confirmedAt,
      },
      updatedAt: confirmedAt,
    };
    await this.repository.savePreparation(next);
    await this.repository.appendSubmissionEvent({
      id: createEventId(preparationId, "authority_confirmed"),
      preparationId,
      type: "authority_confirmed",
      actor: "authority",
      timestamp: confirmedAt,
      authorityReference: reference,
    });
  }

  private async requirePreparation(id: string): Promise<PreparationRecord> {
    const preparation = await this.repository.getPreparation(id);
    if (!preparation) throw new Error(`Preparation ${id} was not found.`);
    return preparation;
  }
}

function assertExportableStatus(preparation: PreparationRecord): void {
  if (!["ready_for_review", "exported", "authority_confirmed"].includes(preparation.status)) {
    throw new Error(
      `Preparation must be ready for review before export; current status is ${preparation.status}.`,
    );
  }
}

function normalizeUserEvidence(
  evidence: UserSubmissionEvidence,
  fallbackTimestamp: string,
): UserSubmissionEvidence {
  if (!isUserSubmissionEvidenceValid(evidence)) {
    throw new Error("Explicit user submission evidence is required.");
  }

  return {
    source: evidence.source.trim(),
    ...(evidence.reference ? { reference: evidence.reference.trim() } : {}),
    submittedAt: evidence.submittedAt?.trim() || fallbackTimestamp,
    ...(evidence.note ? { note: evidence.note.trim() } : {}),
  };
}

function normalizeAuthorityReference(value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Authority confirmation requires an official reference.");
  }
  const reference = value.trim();
  if (reference.length > 200 || /[\u0000-\u001f\u007f]/.test(reference)) {
    throw new Error("Authority confirmation reference is invalid.");
  }
  return reference;
}

function createEventId(preparationId: string, type: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `submission-${preparationId}-${type}-${random}`;
}

export const submissionService = new SubmissionService();

export type { ExportPackageRecord };
export { UniversalExportAdapter };
