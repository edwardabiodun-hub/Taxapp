import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/local-db";

/** Returns true once the check is done, and whether a local login credential exists */
export function useHasAccount() {
  const count = useLiveQuery(() => db.auth.count());
  return {
    loading: count === undefined,
    hasAccount: (count ?? 0) > 0,
  };
}
