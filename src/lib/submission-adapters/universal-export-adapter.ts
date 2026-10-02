import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import { listReceiptRecords } from "@/lib/receipt-repository";
import { generateExportPackage } from "@/lib/exports/export-service";
import type {
  AuthorityStatus,
  SubmissionAdapter,
  SubmissionContext,
  SubmissionPackage,
  UserSubmissionResult,
} from "@/lib/submission-adapters/submission-adapter";

export interface UniversalExportAdapterOptions {
  readonly listReceipts?: (preparationId: string) => Promise<readonly import("@/domain/receipts").ReceiptRecord[]>;
  readonly now?: () => string;
}

/**
 * The launch adapter deliberately stops at a universal export and manual
 * handoff. It never turns a local HTTP-like action into an authority filing.
 */
export class UniversalExportAdapter implements SubmissionAdapter {
  readonly id = "universal-export";
  private readonly listReceipts: NonNullable<UniversalExportAdapterOptions["listReceipts"]>;
  private readonly now?: () => string;

  constructor(options: UniversalExportAdapterOptions = {}) {
    this.listReceipts = options.listReceipts ?? listReceiptRecords;
    this.now = options.now;
  }

  async prepare(
    preparation: PreparationRecord,
    capability: JurisdictionCapability,
  ): Promise<SubmissionPackage> {
    const receipts = await this.listReceipts(preparation.id);
    const exportPackage = await generateExportPackage(
      preparation,
      receipts,
      capability,
      { persist: false, ...(this.now ? { now: this.now } : {}) },
    );

    return {
      id: `submission-package-${exportPackage.id}`,
      preparationId: preparation.id,
      exportPackage,
      handoff: {
        mode: "manual",
        instructions: [
          "Review the calculated figures and supporting-document index.",
          "Download the package and submit it through the applicable authority workflow.",
          "Keep the authority receipt or reference for an explicit confirmation step.",
        ],
        notSubmitted: true,
      },
    };
  }

  async submit(
    _submissionPackage: SubmissionPackage,
    _context: SubmissionContext,
  ): Promise<UserSubmissionResult> {
    throw new Error(
      "Universal export supports manual handoff only; it cannot submit to a tax authority.",
    );
  }

  async getStatus(reference: string): Promise<AuthorityStatus> {
    return {
      status: "unavailable",
      source: "universal_export",
      message: reference.trim()
        ? "No authority status adapter is registered for this jurisdiction."
        : "An authority reference is required for an authority-backed status.",
    };
  }
}

export const universalExportAdapter = new UniversalExportAdapter();
