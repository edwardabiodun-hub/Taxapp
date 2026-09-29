export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export type DocumentFileValidationResult =
  | { valid: true }
  | { valid: false; reason: "too-large" | "unsupported-type" };

export function validateDocumentFile(
  file: Pick<File, "name" | "size" | "type">,
): DocumentFileValidationResult {
  if (file.size > MAX_DOCUMENT_FILE_SIZE) return { valid: false, reason: "too-large" };

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const expectedMimeType = ALLOWED_DOCUMENT_TYPES[extension];
  if (!expectedMimeType || file.type.toLowerCase() !== expectedMimeType) {
    return { valid: false, reason: "unsupported-type" };
  }

  return { valid: true };
}
