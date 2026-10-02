import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalActivity, type LocalDeclaration, type LocalProfile } from "@/lib/local-db";
import type { PreparationRecord } from "@/domain/preparations";
import type { PreparationStatus } from "@/domain/tax-readiness";
import { getPreparation, listPreparations } from "@/lib/preparation-repository";

export function useProfile(): LocalProfile | undefined {
  return useLiveQuery(() => db.profiles.toCollection().first());
}

export function useDeclarations(filter?: {
  status?: LocalDeclaration["status"];
}): LocalDeclaration[] {
  return (
    useLiveQuery(() => {
      let query = db.declarations.orderBy("createdAt");
      if (filter?.status) {
        query = db.declarations.where("status").equals(filter.status);
      }
      return query.reverse().toArray();
    }, [filter?.status]) ?? []
  );
}

/** New preparation flow reads are kept behind the repository boundary. */
export function usePreparations(filter?: {
  status?: PreparationStatus;
}): PreparationRecord[] {
  return (
    useLiveQuery(
      async () => {
        const preparations = await listPreparations();
        return filter?.status
          ? preparations.filter((preparation) => preparation.status === filter.status)
          : preparations;
      },
      [filter?.status],
    ) ?? []
  );
}

export function usePreparation(id: string | undefined): PreparationRecord | undefined {
  return useLiveQuery(
    () => (id ? getPreparation(id) : undefined),
    [id],
  );
}

export function useReferenceData<T = any>(key: string): T | undefined {
  return useLiveQuery(async () => {
    const row = await db.referenceData.get(key);
    return row?.value as T | undefined;
  }, [key]);
}

export function useActivities(declarationId: string): LocalActivity[] {
  return (
    useLiveQuery(
      () =>
        db.activities
          .where("declarationId")
          .equals(declarationId)
          .sortBy("timestamp"),
      [declarationId]
    ) ?? []
  );
}
