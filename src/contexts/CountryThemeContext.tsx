import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Country flag-based color themes.
 * Each palette maps to CSS variable overrides using HSL values.
 * Primary = dominant flag color, Accent = secondary flag color.
 */
interface CountryTheme {
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  ring: string;
  gradientPrimary: string;
  gradientAccent: string;
  gradientHero: string;
  sidebarBg: string;
  sidebarAccent: string;
  success: string;
  warning: string;
}

const themes: Record<string, CountryTheme> = {
  // 🇳🇬 Nigeria — Green & White
  ng: {
    primary: "152 55% 28%",
    primaryLight: "152 45% 38%",
    accent: "36 70% 55%",
    accentLight: "36 80% 62%",
    ring: "152 55% 28%",
    gradientPrimary: "linear-gradient(135deg, hsl(152 55% 28%), hsl(152 45% 38%))",
    gradientAccent: "linear-gradient(135deg, hsl(36 70% 55%), hsl(36 80% 62%))",
    gradientHero: "linear-gradient(160deg, hsl(152 30% 12%) 0%, hsl(152 55% 28%) 50%, hsl(36 70% 55%) 100%)",
    sidebarBg: "152 30% 12%",
    sidebarAccent: "152 25% 18%",
    success: "152 60% 40%",
    warning: "36 90% 55%",
  },
  // 🇰🇪 Kenya — Black, Red, Green + White
  ke: {
    primary: "0 72% 38%",
    primaryLight: "0 65% 48%",
    accent: "145 55% 30%",
    accentLight: "145 45% 40%",
    ring: "0 72% 38%",
    gradientPrimary: "linear-gradient(135deg, hsl(0 72% 38%), hsl(0 65% 48%))",
    gradientAccent: "linear-gradient(135deg, hsl(145 55% 30%), hsl(145 45% 40%))",
    gradientHero: "linear-gradient(160deg, hsl(0 0% 10%) 0%, hsl(0 72% 38%) 50%, hsl(145 55% 30%) 100%)",
    sidebarBg: "0 20% 10%",
    sidebarAccent: "0 15% 16%",
    success: "145 55% 38%",
    warning: "0 72% 45%",
  },
  // 🇬🇭 Ghana — Red, Gold, Green + Black star
  gh: {
    primary: "0 72% 40%",
    primaryLight: "0 65% 50%",
    accent: "45 90% 50%",
    accentLight: "45 95% 58%",
    ring: "0 72% 40%",
    gradientPrimary: "linear-gradient(135deg, hsl(0 72% 40%), hsl(0 65% 50%))",
    gradientAccent: "linear-gradient(135deg, hsl(45 90% 50%), hsl(45 95% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(145 50% 22%) 0%, hsl(0 72% 40%) 50%, hsl(45 90% 50%) 100%)",
    sidebarBg: "145 30% 12%",
    sidebarAccent: "145 25% 18%",
    success: "145 55% 35%",
    warning: "45 90% 50%",
  },
  // 🇿🇦 South Africa — Green, Gold, Black, White, Red, Blue
  za: {
    primary: "145 65% 30%",
    primaryLight: "145 55% 40%",
    accent: "45 85% 50%",
    accentLight: "45 90% 58%",
    ring: "145 65% 30%",
    gradientPrimary: "linear-gradient(135deg, hsl(145 65% 30%), hsl(145 55% 40%))",
    gradientAccent: "linear-gradient(135deg, hsl(45 85% 50%), hsl(45 90% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(0 0% 10%) 0%, hsl(145 65% 30%) 40%, hsl(45 85% 50%) 70%, hsl(0 70% 45%) 100%)",
    sidebarBg: "145 30% 10%",
    sidebarAccent: "145 25% 16%",
    success: "145 60% 38%",
    warning: "45 85% 50%",
  },
  // 🇹🇿 Tanzania — Blue, Gold, Green, Black
  tz: {
    primary: "210 70% 40%",
    primaryLight: "210 60% 50%",
    accent: "50 85% 50%",
    accentLight: "50 90% 58%",
    ring: "210 70% 40%",
    gradientPrimary: "linear-gradient(135deg, hsl(210 70% 40%), hsl(210 60% 50%))",
    gradientAccent: "linear-gradient(135deg, hsl(50 85% 50%), hsl(50 90% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(145 50% 22%) 0%, hsl(210 70% 40%) 50%, hsl(50 85% 50%) 100%)",
    sidebarBg: "210 30% 12%",
    sidebarAccent: "210 25% 18%",
    success: "145 55% 38%",
    warning: "50 85% 50%",
  },
  // 🇺🇬 Uganda — Black, Yellow, Red + White
  ug: {
    primary: "0 70% 42%",
    primaryLight: "0 65% 52%",
    accent: "50 90% 50%",
    accentLight: "50 95% 58%",
    ring: "0 70% 42%",
    gradientPrimary: "linear-gradient(135deg, hsl(0 70% 42%), hsl(0 65% 52%))",
    gradientAccent: "linear-gradient(135deg, hsl(50 90% 50%), hsl(50 95% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(0 0% 10%) 0%, hsl(0 70% 42%) 50%, hsl(50 90% 50%) 100%)",
    sidebarBg: "0 15% 10%",
    sidebarAccent: "0 12% 16%",
    success: "145 55% 38%",
    warning: "50 90% 50%",
  },
  // 🇷🇼 Rwanda — Blue, Yellow, Green
  rw: {
    primary: "210 75% 42%",
    primaryLight: "210 65% 52%",
    accent: "50 90% 50%",
    accentLight: "50 95% 58%",
    ring: "210 75% 42%",
    gradientPrimary: "linear-gradient(135deg, hsl(210 75% 42%), hsl(210 65% 52%))",
    gradientAccent: "linear-gradient(135deg, hsl(50 90% 50%), hsl(50 95% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(210 40% 15%) 0%, hsl(210 75% 42%) 50%, hsl(50 90% 50%) 100%)",
    sidebarBg: "210 30% 12%",
    sidebarAccent: "210 25% 18%",
    success: "145 55% 38%",
    warning: "50 90% 50%",
  },
  // 🇪🇹 Ethiopia — Green, Yellow, Red + Blue star
  et: {
    primary: "145 60% 30%",
    primaryLight: "145 50% 40%",
    accent: "50 90% 50%",
    accentLight: "50 95% 58%",
    ring: "145 60% 30%",
    gradientPrimary: "linear-gradient(135deg, hsl(145 60% 30%), hsl(145 50% 40%))",
    gradientAccent: "linear-gradient(135deg, hsl(50 90% 50%), hsl(50 95% 58%))",
    gradientHero: "linear-gradient(160deg, hsl(145 30% 12%) 0%, hsl(145 60% 30%) 40%, hsl(50 90% 50%) 70%, hsl(0 70% 42%) 100%)",
    sidebarBg: "145 30% 12%",
    sidebarAccent: "145 25% 18%",
    success: "145 60% 38%",
    warning: "50 90% 50%",
  },
};

interface ThemeContextType {
  country: string;
  setCountry: (code: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  country: "ng",
  setCountry: () => {},
});

export const useCountryTheme = () => useContext(ThemeContext);

function applyTheme(code: string) {
  const theme = themes[code] || themes.ng;
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--secondary", theme.accent);
  root.style.setProperty("--success", theme.success);
  root.style.setProperty("--warning", theme.warning);
  root.style.setProperty("--sidebar-background", theme.sidebarBg);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--sidebar-primary", theme.accent);
  root.style.setProperty("--sidebar-ring", theme.accent);
  root.style.setProperty("--gradient-primary", theme.gradientPrimary);
  root.style.setProperty("--gradient-accent", theme.gradientAccent);
  root.style.setProperty("--gradient-hero", theme.gradientHero);
}

export function CountryThemeProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem("taxease-country") || "ng";
  });

  const setCountry = (code: string) => {
    setCountryState(code);
    localStorage.setItem("taxease-country", code);
  };

  useEffect(() => {
    applyTheme(country);
  }, [country]);

  return (
    <ThemeContext.Provider value={{ country, setCountry }}>
      {children}
    </ThemeContext.Provider>
  );
}
