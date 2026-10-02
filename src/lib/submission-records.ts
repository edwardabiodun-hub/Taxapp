import type { PreparationRecord } from "@/domain/preparations";
import type { LocalDeclaration } from "@/lib/local-db";

export type SubmissionRecord =
  | {
      readonly id: string;
      readonly kind: "preparation";
      readonly preparation: PreparationRecord;
      readonly legacy?: LocalDeclaration;
    }
  | {
      readonly id: string;
      readonly kind: "legacy";
      readonly declaration: LocalDeclaration;
    };

/**
 * Keeps legacy declarations visible while avoiding duplicate rows after a
 * declaration has been materialized as a preparation. The underlying legacy
 * row is retained on the merged preparation record for detail/history views.
 */
export function mergeSubmissionRecords(
  preparations: readonly PreparationRecord[],
  declarations: readonly LocalDeclaration[],
): SubmissionRecord[] {
  const legacyById = new Map(declarations.map((declaration) => [declaration.id, declaration]));
  const preparationIds = new Set(preparations.map((preparation) => preparation.id));

  return [
    ...preparations.map((preparation) => ({
      id: preparation.id,
      kind: "preparation" as const,
      preparation,
      legacy: legacyById.get(preparation.id),
    })),
    ...declarations
      .filter((declaration) => !preparationIds.has(declaration.id))
      .map((declaration) => ({
        id: declaration.id,
        kind: "legacy" as const,
        declaration,
      })),
  ].sort((left, right) => {
    const leftUpdatedAt = left.kind === "preparation"
      ? left.preparation.updatedAt
      : left.declaration.updatedAt;
    const rightUpdatedAt = right.kind === "preparation"
      ? right.preparation.updatedAt
      : right.declaration.updatedAt;
    return rightUpdatedAt.localeCompare(leftUpdatedAt);
  });
}
