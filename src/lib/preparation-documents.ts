import type { PreparationDocumentMetadata } from "@/domain/preparations";
import type { UploadedDoc } from "@/components/declaration/DocumentsStep";

export function getDocumentMetadata(
  documents: readonly UploadedDoc[],
): readonly PreparationDocumentMetadata[] {
  return documents.map(({ id, file, category }) => ({
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    category,
  }));
}
