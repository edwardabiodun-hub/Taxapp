import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  /** True once the user has entered correct credentials this session. Lives
   * only in memory — restarting the app always requires unlocking again,
   * by design (this is the login gate the app previously had none of). */
  isUnlocked: boolean;
  unlock: () => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  unlock: () => {},
  lock: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        isUnlocked,
        unlock: () => setIsUnlocked(true),
        lock: () => setIsUnlocked(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
