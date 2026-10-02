import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Which country the user is working in. Previously also drove a runtime
 * CSS-variable-overwriting theme-per-country system (green for Nigeria, etc)
 * -- retired because it would silently undo the FileSmart reskin's static
 * palette the moment a user passed through the wizard's Country step. This
 * context now only tracks the selection itself, which Profile.tsx and
 * CountryStep.tsx still need independent of any theming concern.
 */
interface ThemeContextType {
  country: string;
  setCountry: (code: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  country: "ng",
  setCountry: () => {},
});

export const useCountryTheme = () => useContext(ThemeContext);

export function CountryThemeProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem("taxease-country") || "ng";
  });

  const setCountry = (code: string) => {
    setCountryState(code);
    localStorage.setItem("taxease-country", code);
  };

  return (
    <ThemeContext.Provider value={{ country, setCountry }}>
      {children}
    </ThemeContext.Provider>
  );
}
