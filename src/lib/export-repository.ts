import { db, type ExportPackageRecord } from "@/lib/local-db";

export async function saveExportPackage(exportPackage: ExportPackageRecord): Promise<void> {
  await db.exportPackages.put(exportPackage);
}

export async function getExportPackage(id: string): Promise<ExportPackageRecord | undefined> {
  return db.exportPackages.get(id);
}

export async function listExportPackages(preparationId: string): Promise<ExportPackageRecord[]> {
  return db.exportPackages.where("preparationId").equals(preparationId).toArray();
}
