import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/local-db";

/** Returns true once the check is done, and whether a profile exists */
export function useHasProfile() {
  const count = useLiveQuery(() => db.profiles.count());
  return {
    loading: count === undefined,
    hasProfile: (count ?? 0) > 0,
  };
}
