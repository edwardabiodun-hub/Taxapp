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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isUnlocked: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading: session === undefined,
        isUnlocked: session != null,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
