import type { JurisdictionCapability } from "@/domain/jurisdictions";
import type { PreparationRecord } from "@/domain/preparations";
import type { ReceiptRecord } from "@/domain/receipts";
import {
  EXPORT_SCHEMA_VERSION,
  type ExportArtifact,
  type ExportMetadata,
  type ExportPackage,
} from "@/domain/exports";
import { createCsvArtifact } from "@/lib/exports/csv-exporter";
import { createPdfArtifact } from "@/lib/exports/pdf-exporter";
import { createXlsxArtifact } from "@/lib/exports/xlsx-exporter";
import { sanitizeExportMetadata } from "@/lib/exports/export-data";
import { saveExportPackage } from "@/lib/export-repository";
import { savePreparation } from "@/lib/preparation-repository";
import type { ExportPackageRecord } from "@/lib/local-db";

export interface ExportGenerationOptions {
  readonly now?: () => string;
  /** Generation is pure by default; set true when the workflow has persistence available. */
  readonly persist?: boolean;
  readonly persistence?: ExportPersistence;
}

export interface ExportPersistence {
  readonly saveExportPackage: (record: ExportPackageRecord) => Promise<void>;
  readonly savePreparation: (preparation: PreparationRecord) => Promise<void>;
}

const defaultPersistence: ExportPersistence = { saveExportPackage, savePreparation };

export async function generateExportPackage(
  preparation: PreparationRecord,
  receipts: readonly ReceiptRecord[],
  capability: JurisdictionCapability,
  options: ExportGenerationOptions = {},
): Promise<ExportPackage> {
  if (preparation.jurisdictionCode.trim().toUpperCase() !== capability.jurisdictionCode.trim().toUpperCase()) {
    throw new Error("Preparation jurisdiction does not match the selected capability.");
  }

  const generatedAt = options.now?.() ?? new Date().toISOString();
  const metadata = sanitizeExportMetadata(buildExportMetadata(preparation, capability, generatedAt));
  const packageId = `export-${safePart(preparation.id)}-${compactTimestamp(generatedAt)}`;
  const context = { preparation, receipts, capability, metadata };
  const formats = ["pdf", "csv", "xlsx"] as const;
  const artifacts = await Promise.all(formats.map(async (format) => {
    const fileName = `taxease-${safePart(preparation.id)}-${safePart(preparation.taxYear)}.${format}`;
    const artifactRef = `exports/${safePart(preparation.id)}/${format}/${safePart(compactTimestamp(generatedAt))}`;
    if (format === "pdf") return createPdfArtifact(context, fileName, artifactRef);
    if (format === "csv") return createCsvArtifact(context, fileName, artifactRef);
    return createXlsxArtifact(context, fileName, artifactRef);
  })) as readonly ExportArtifact[];
  const result: ExportPackage = {
    id: packageId,
    preparationId: preparation.id,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    status: "exported",
    metadata,
    generatedAt,
    artifacts,
  };

  if (options.persist) await persistExportMetadata(result, preparation, options.persistence);
  return result;
}

export async function persistExportMetadata(
  exportPackage: ExportPackage,
  preparation: PreparationRecord,
  persistence: ExportPersistence = defaultPersistence,
): Promise<void> {
  for (const artifact of exportPackage.artifacts) {
    await persistence.saveExportPackage({
      id: `${exportPackage.id}-${artifact.format}`,
      preparationId: preparation.id,
      format: artifact.format,
      assetRef: artifact.artifactRef,
      ruleProfileVersion: exportPackage.metadata.ruleProfileVersion,
      calculationLabel: exportPackage.metadata.calculationLabel,
      schemaVersion: exportPackage.schemaVersion,
      jurisdiction: exportPackage.metadata.jurisdiction,
      jurisdictionCode: exportPackage.metadata.jurisdictionCode,
      taxYear: exportPackage.metadata.taxYear,
      readiness: exportPackage.metadata.readiness,
      generatedAt: exportPackage.generatedAt,
      notSubmitted: true,
      source: exportPackage.metadata.source,
      sourceVerifiedAt: exportPackage.metadata.sourceVerifiedAt,
      deadlineSource: exportPackage.metadata.deadlineSource,
      deadlineVerifiedAt: exportPackage.metadata.deadlineVerifiedAt,
      metadata: exportPackage.metadata,
      createdAt: exportPackage.generatedAt,
    });
  }

  if (preparation.status !== "authority_confirmed") {
    await persistence.savePreparation({
      ...preparation,
      status: "exported",
      lastExportedAt: exportPackage.generatedAt,
      updatedAt: exportPackage.generatedAt,
    });
  }
}

function buildExportMetadata(
  preparation: PreparationRecord,
  capability: JurisdictionCapability,
  generatedAt: string,
): ExportMetadata {
  const ruleProfile = preparation.calculationProvenance.ruleProfileId || capability.ruleProfile.profileId;
  const deadline = capability.deadlineProfile.kind === "unverified"
    ? { source: "", verifiedAt: "" }
    : { source: capability.deadlineProfile.evidence.source, verifiedAt: capability.deadlineProfile.evidence.verifiedAt };
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    preparationId: preparation.id,
    jurisdiction: capability.name,
    jurisdictionCode: capability.jurisdictionCode,
    taxYear: preparation.taxYear,
    registryVersion: capability.registryVersion,
    ruleProfileId: ruleProfile,
    ruleProfileVersion: preparation.calculationProvenance.ruleProfileVersion || preparation.ruleProfileVersion,
    calculationLabel: preparation.calculationLabel,
    readiness: preparation.filingReadiness,
    source: preparation.calculationProvenance.source,
    sourceVerifiedAt: preparation.calculationProvenance.verifiedAt,
    deadlineSource: deadline.source,
    deadlineVerifiedAt: deadline.verifiedAt,
    generatedAt,
    notSubmitted: true,
  };
}

function safePart(value: string): string {
  const safe = value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "");
  return safe || "preparation";
}

function compactTimestamp(value: string): string {
  return value.replace(/[^0-9]/g, "").slice(0, 17) || "generated";
}
