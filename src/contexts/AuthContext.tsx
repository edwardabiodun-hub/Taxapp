import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

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
   * ResetPassword triggers once the new password is set. */
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading: session === undefined,
        isUnlocked: session != null,
        isPasswordRecovery,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
