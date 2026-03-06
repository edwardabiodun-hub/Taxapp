import { useLiveQuery } from "dexie-react-hooks";
import { db, type LocalActivity, type LocalDeclaration, type LocalProfile } from "@/lib/local-db";

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
