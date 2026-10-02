import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/local-db";
import { fetchProfileFromServer } from "@/lib/api";

/**
 * When a session exists but this device has no local profile — a fresh
 * device, a reinstall, or cleared storage, NOT necessarily a brand-new
 * account — check the server for a profile already pushed under this
 * account and restore it locally instead of forcing the user back through
 * onboarding. Runs at most once per mount (`shouldCheck` toggling back to
 * true after a completed check does not re-fetch). If the server has no
 * profile for this account (a genuinely new signup) or the check fails,
 * this writes nothing and the caller falls back to onboarding as before.
 */
export function useRestoreProfile(shouldCheck: boolean) {
  const [checking, setChecking] = useState(shouldCheck);
  const attempted = useRef(false);

  useEffect(() => {
    if (!shouldCheck || attempted.current) return;
    attempted.current = true;
    setChecking(true);

    fetchProfileFromServer()
      .then(async (profile) => {
        if (profile) {
          await db.profiles.put(profile);
        }
      })
      .catch((err) => {
        console.error("[restore-profile] Failed to check server for an existing profile:", err);
      })
      .finally(() => setChecking(false));
  }, [shouldCheck]);

  return { checking };
}
