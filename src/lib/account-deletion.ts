import { db } from "./local-db";
import { deleteDeclarationFromServer, pseudonymizeProfileOnServer } from "./api";
import { signOut } from "./auth";
import { isUnderRetentionHold } from "./data-retention";

export interface AccountDeletionResult {
  declarationsDeleted: string[];
  declarationsRetained: string[];
  /** Server delete failed unexpectedly (network, or a backstop RLS refusal
   * this function's own pre-filter should have already caught) — left
   * untouched both locally and on the server so state can't drift. */
  declarationsFailed: string[];
  profilePseudonymized: boolean;
}

/**
 * Honors a user's deletion request while staying inside NTAA 2025 s.31(5)'s
 * six-year mandatory retention window: declarations still under hold are
 * left alone entirely; everything else is deleted server-side first, and
 * only removed locally once that succeeds — never the other way around,
 * since a locally-deleted-but-still-present-on-the-server declaration
 * would just get pulled back down and resurrected by the next sync.
 */
export async function requestAccountDeletion(): Promise<AccountDeletionResult> {
  const declarations = await db.declarations.toArray();
  const deleted: string[] = [];
  const retained: string[] = [];
  const failed: string[] = [];

  for (const declaration of declarations) {
    if (isUnderRetentionHold(declaration)) {
      retained.push(declaration.id);
      continue;
    }

    try {
      await deleteDeclarationFromServer(declaration.id);
    } catch {
      failed.push(declaration.id);
      continue;
    }

    await db.activities.where("declarationId").equals(declaration.id).delete();
    await db.declarations.delete(declaration.id);
    deleted.push(declaration.id);
  }

  await pseudonymizeProfileOnServer();

  const profile = await db.profiles.toCollection().first();
  if (profile) {
    await db.profiles.update(profile.id, {
      name: "Deleted user",
      email: "",
      phone: "",
      dateOfBirth: undefined,
      countryOfBirth: undefined,
      gender: undefined,
      nationality: undefined,
      pseudonymizedAt: new Date().toISOString(),
    });
  }

  await signOut();

  return {
    declarationsDeleted: deleted,
    declarationsRetained: retained,
    declarationsFailed: failed,
    profilePseudonymized: !!profile,
  };
}
