import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

/** sessionStorage key backing the password-recovery flag below — namespaced
 * so it doesn't collide with anything else in the app or in Supabase's own
 * storage. Per-tab (sessionStorage, not localStorage) and cleared on
 * sign-out. */
const PASSWORD_RECOVERY_STORAGE_KEY = "fs_password_recovery";

function readStoredRecoveryFlag(): boolean {
  try {
    if (sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "true") return true;
  } catch {
    // sessionStorage unavailable (private browsing, blocked storage, etc.)
  }
  try {
    // Supabase's PASSWORD_RECOVERY auth event is dispatched asynchronously
    // (via setTimeout(..., 0) internally), so on first landing there's one
    // render where getSession() has already resolved a session but the
    // event hasn't fired yet. Reading the recovery hash directly here closes
    // that gap so the flag is correct from the very first render.
    if (window.location.hash.includes("type=recovery")) return true;
  } catch {
    // window/location unavailable in some test environments
  }
  return false;
}

function writeStoredRecoveryFlag(value: boolean) {
  try {
    if (value) {
      sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true");
    } else {
      sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    }
  } catch {
    // sessionStorage unavailable — the in-memory state still works for
    // the current render, it just won't survive a refresh.
  }
}

interface AuthContextType {
  /** true while the initial session check hasn't resolved yet. */
  loading: boolean;
  /** true once a valid session exists — either just signed in, or restored
   * from Supabase's own persisted session cache (this is what makes
   * offline app-open work: no network round-trip needed for a still-valid
   * cached session). Unlike the PR #3 login gate this replaces, the app
   * does NOT require re-entering credentials on every restart — a signed-in
   * session stays signed in until it actually expires or the user signs
   * out, matching how session-backed auth normally behaves. */
  isUnlocked: boolean;
  /** true once Supabase reports a PASSWORD_RECOVERY event — the user just
   * landed on a valid reset-password email link, which the SDK turns into
   * a temporary session. This is distinct from a normal isUnlocked session
   * and must take routing priority over it: App.tsx checks this before
   * hasProfile/isUnlocked so a recovery session is never swept into
   * onboarding or straight into the main app. Cleared on sign-out, which
   * ResetPassword triggers once the new password is set.
   *
   * Backed by sessionStorage (see PASSWORD_RECOVERY_STORAGE_KEY below) so a
   * refresh of /reset-password mid-flow doesn't lose the flag — no new
   * PASSWORD_RECOVERY event fires on remount, only the persisted Supabase
   * session. Gated on session != null so a stale storage flag can never
   * show the reset form once there's no active session backing it. */
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isUnlocked: false,
  isPasswordRecovery: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recoveryFlag, setRecoveryFlag] = useState(readStoredRecoveryFlag);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") {
        writeStoredRecoveryFlag(true);
        setRecoveryFlag(true);
      }
      if (event === "SIGNED_OUT") {
        writeStoredRecoveryFlag(false);
        setRecoveryFlag(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading: session === undefined,
        isUnlocked: session != null,
        // A stale storage flag (or a leftover recovery hash) must never show
        // the reset form when there's no active session backing it.
        isPasswordRecovery: recoveryFlag && session != null,
        signOut: async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error("signOut failed:", error);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
