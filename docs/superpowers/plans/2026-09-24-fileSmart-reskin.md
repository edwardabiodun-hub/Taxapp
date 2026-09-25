# FileSmart-Inspired Reskin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin TaxEase's existing mobile screens/navigation to match the "FileSmart" design template's visual language (flat blue palette, system fonts, no gradients/shadows, matched radius), restructure the Dashboard's content to mirror the template, retire the per-country runtime theming system that would otherwise fight the new palette, and rename the app's display name to "FileSmart."

**Architecture:** Almost all of the gradient/shadow flattening is achieved by redefining five shared utility classes and CSS custom properties in `index.css` (`.gradient-primary`, `.gradient-accent`, `.gradient-hero`, `--shadow-card`, `--shadow-elevated`) — since every component already references these by class name, redefining what they render as (flat colors, no shadow) reskins ~15 files with zero changes to those files. Only genuinely bespoke changes (a few `gradient-hero` sites that want a different flat color than the class's new default, a mechanical `rounded-2xl`→`rounded-xl` sweep, the nav's distinct active-tab treatment, a new StatCard variant, the Dashboard restructure, and the context retirement) get their own tasks.

**Tech Stack:** React, TypeScript, Tailwind CSS (HSL/color CSS custom properties), shadcn/ui, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-fileSmart-reskin-design.md`

**Deviation from the spec, and why:** the spec's Scope section describes "18 call sites" for gradient-primary/accent/hero becoming flat colors, implying per-file className edits. Instead, this plan redefines the shared `.gradient-primary`/`.gradient-accent`/`.gradient-hero` utility classes and `--shadow-card`/`--shadow-elevated` custom properties directly in `index.css` — every one of gradient-primary's and gradient-accent's existing use sites already means "primary action" / "secondary action" consistently, so redefining the class achieves the exact same visual outcome as editing every call site, with far less code churn and no risk of missing one. `gradient-hero`'s 5 use sites are NOT all semantically consistent (2 want the new info-blue, 3 want primary-blue), so those 3 get an explicit one-word className swap to `gradient-primary` (Task 3) — the plan still touches every site that needs a *different* outcome than the class's new default, it just doesn't touch sites that don't.

## Global Constraints

- Colors are stored as complete values (hex or `oklch()`), not bare HSL components — `tailwind.config.ts`'s color mapping changes from `"hsl(var(--x))"` to `"var(--x)"` for every token.
- Every color value copied from the template must match exactly what's in `docs/superpowers/specs/2026-09-24-fileSmart-reskin-design.md`'s palette table — no invented values.
- `src/lib/local-db.ts`'s Dexie database name (`"TaxEaseAfrica"`) and `capacitor.config.ts`'s `appId` are NOT touched by this plan — renaming either risks real data loss / store-registration issues, per the spec's explicit exclusion.
- `CountryThemeContext.tsx`'s `country`/`setCountry` state (used by `Profile.tsx`/`CountrySelector.tsx` for country *selection*, independent of theming) must keep working after this plan removes its CSS-variable-writing side effect.
- No new gradients, shadows on standard cards, or non-system fonts are introduced anywhere in this plan's changes.

## Review Focus

1. **Selecting Nigeria in the wizard's Country step must not change the color scheme anymore** — this was the original bug motivating the CountryThemeContext retirement; if `applyTheme()`'s CSS-var writes aren't fully removed, the reskin silently undoes itself on this specific user action.
2. **`Profile.tsx`/`CountrySelector.tsx` must still work after the context is gutted** — they consume `country`/`setCountry` for a real feature (country selection), not just theming; removing too much breaks them.
3. **No `rounded-2xl` instance is missed** — the sweep touches specific named lines; a straggler would visually clash with every other now-12px-max card. Verified by a final repo-wide grep showing zero matches.
4. **The 3 `gradient-hero` sites that should become `gradient-primary` (Dashboard, Onboarding, ProfileHeader) vs. the 2 that should stay `gradient-hero` (ReviewStep, TaxCalculator) are not mixed up** — getting this backwards puts the wrong blue on a user-facing summary panel.
5. **The Dashboard tip card's copy stays evergreen** — no accidentally-dated language ("2026", "today", "this week") that would misrepresent a static UI element as live content.

---

### Task 1: Rewrite color tokens, fonts, radius, and flatten shared gradient/shadow classes

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: every color/font/radius CSS custom property and Tailwind color mapping that all later tasks and all untouched components rely on. `.gradient-primary`/`.gradient-accent`/`.gradient-hero` classes (still so-named — see Deviation above) now render flat colors; `.shadow-card`/`.shadow-elevated` render no shadow. New tokens: `--muted-foreground-2`, `--success-bg`, `--warning-bg`, `--info`, `--info-foreground`, `--info-bg`, `--primary-tint` (the template's exact `#E7F1F6` active-nav tint, consumed by Task 5).

No automated test — this is a pure CSS/config change with no isolable logic. Verified via `npm run build` (catches any Tailwind/PostCSS syntax error) and a manual visual pass (Task 8's final verification step covers the full app).

- [ ] **Step 1: Replace `src/index.css`**

Replace the entire file content with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #F5F7F8;
    --foreground: #1A2530;

    --card: #FFFFFF;
    --card-foreground: #1A2530;

    --popover: #FFFFFF;
    --popover-foreground: #1A2530;

    --primary: #0A5C8A;
    --primary-foreground: #FFFFFF;
    /* Exact tint the template uses for an active nav item's background
       (distinct from --primary itself) -- see BottomNav.tsx (Task 5). */
    --primary-tint: #E7F1F6;

    --secondary: oklch(58% 0.12 70);
    --secondary-foreground: #FFFFFF;

    --muted: #EEF1F3;
    --muted-foreground: #5B6B76;
    /* Lighter/tertiary muted text -- the template distinguishes this from
       --muted-foreground (e.g. document upload dates vs. document names). */
    --muted-foreground-2: #8B98A2;

    --accent: oklch(58% 0.12 70);
    --accent-foreground: #FFFFFF;

    --destructive: #DC2626;
    --destructive-foreground: #FFFFFF;

    --border: #E4E8EB;
    --input: #D8DEE2;
    --ring: #0A5C8A;

    --radius: 0.75rem;

    --success: oklch(45% 0.09 150);
    --success-foreground: #FFFFFF;
    --success-bg: oklch(96% 0.02 150);

    --warning: oklch(58% 0.12 70);
    --warning-foreground: #FFFFFF;
    --warning-bg: oklch(96% 0.02 70);

    --info: oklch(45% 0.09 230);
    --info-foreground: #FFFFFF;
    --info-bg: oklch(96% 0.015 230);

    --sidebar-background: #1A2530;
    --sidebar-foreground: #F5F7F8;
    --sidebar-primary: #0A5C8A;
    --sidebar-primary-foreground: #FFFFFF;
    --sidebar-accent: #23303D;
    --sidebar-accent-foreground: #F5F7F8;
    --sidebar-border: #2C3B4A;
    --sidebar-ring: #0A5C8A;

    /* No shadow anywhere on a standard card -- the template separates
       surfaces with a 1px border only. */
    --shadow-card: none;
    --shadow-elevated: none;
  }

  .dark {
    --background: #0F1721;
    --foreground: #E7ECEF;

    --card: #16202B;
    --card-foreground: #E7ECEF;

    --popover: #16202B;
    --popover-foreground: #E7ECEF;

    /* Lightened for AA contrast against the dark background -- the light
       theme's #0A5C8A (L~29%) is too dark to read well on #0F1721. */
    --primary: #3E92C4;
    --primary-foreground: #0F1721;
    --primary-tint: #1B2A38;

    --secondary: oklch(65% 0.11 70);
    --secondary-foreground: #0F1721;

    --muted: #1C2733;
    --muted-foreground: #9AA7B1;
    --muted-foreground-2: #6E7B85;

    --accent: oklch(65% 0.11 70);
    --accent-foreground: #0F1721;

    --destructive: #EF4444;
    --destructive-foreground: #0F1721;

    --border: #24313E;
    --input: #24313E;
    --ring: #3E92C4;

    --success: oklch(70% 0.12 150);
    --success-foreground: #0F1721;
    --success-bg: oklch(25% 0.04 150);

    --warning: oklch(70% 0.13 70);
    --warning-foreground: #0F1721;
    --warning-bg: oklch(25% 0.04 70);

    --info: oklch(65% 0.11 230);
    --info-foreground: #0F1721;
    --info-bg: oklch(25% 0.04 230);
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground font-body antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display font-bold tracking-tight;
  }
}

@layer utilities {
  /* Named "gradient-*" for historical reasons -- these render flat colors
     now (see the plan's Deviation note). Kept under their original names
     so no component file needs editing to pick up the new flat look. */
  .gradient-primary {
    background: var(--primary);
  }
  .gradient-accent {
    background: var(--accent);
  }
  .gradient-hero {
    background: var(--info);
  }
  .shadow-card {
    box-shadow: var(--shadow-card);
  }
  .shadow-elevated {
    box-shadow: var(--shadow-elevated);
  }
  .safe-area-top {
    padding-top: env(safe-area-inset-top, 0px);
  }
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}
```

- [ ] **Step 2: Replace `tailwind.config.ts`**

Replace the entire file content with:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['-apple-system', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['-apple-system', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(16px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

- [ ] **Step 3: Build to verify no syntax errors**

Run: `npm run build`
Expected: succeeds, no PostCSS/Tailwind errors.

- [ ] **Step 4: Commit**

```bash
git add src/index.css tailwind.config.ts
git commit -m "feat: rewrite color tokens, fonts, and flatten gradient/shadow classes"
```

---

### Task 2: Retire CountryThemeContext's runtime CSS-variable theming

**Files:**
- Modify: `src/contexts/CountryThemeContext.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useCountryTheme(): { country: string; setCountry: (code: string) => void }` — same exported signature as before, consumed unchanged by `Profile.tsx` and `CountryStep.tsx` (no changes needed in either of those files).

No automated test exists for this file today (checked — no `CountryThemeContext.test.tsx`). Verified via `npm run build` plus the manual check in Task 8 confirming selecting Nigeria in the wizard no longer changes colors, and that `Profile.tsx`'s country selector still works.

- [ ] **Step 1: Replace the file's content**

Replace the entire content of `src/contexts/CountryThemeContext.tsx` with:

```tsx
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
```

- [ ] **Step 2: Build to verify no broken imports**

Run: `npm run build`
Expected: succeeds — confirms nothing outside this file imported `applyTheme` or `themes` (neither was exported, so nothing could have).

- [ ] **Step 3: Commit**

```bash
git add src/contexts/CountryThemeContext.tsx
git commit -m "fix: stop CountryThemeContext from overwriting the reskin's CSS variables"
```

---

### Task 3: Point the three brand-panel `gradient-hero` sites at `gradient-primary`

**Files:**
- Modify: `src/pages/Dashboard.tsx:99`
- Modify: `src/pages/Onboarding.tsx:171`
- Modify: `src/components/profile/ProfileHeader.tsx:10`

**Interfaces:**
- Consumes: `.gradient-primary` (now flat `var(--primary)`, from Task 1).
- Produces: nothing new for other tasks.

These three sites are "brand panel" uses of the old `gradient-hero` (Dashboard's primary CTA, Onboarding's header banner, the profile summary card) — they should render solid primary blue like the template's equivalent elements, not the info-blue `gradient-hero` now renders (that's reserved for the two tax-result panels in Task 4). No automated test — pure className changes. Verified via `npm run build` and Task 8's manual pass.

- [ ] **Step 1: Update Dashboard.tsx's primary CTA**

In `src/pages/Dashboard.tsx`, change:

```tsx
        className="w-full gradient-hero rounded-2xl p-5 flex items-center gap-4 shadow-elevated text-primary-foreground group"
```

to:

```tsx
        className="w-full gradient-primary rounded-xl p-5 flex items-center gap-4 text-primary-foreground group"
```

(`shadow-elevated` removed — Task 1 already made it render nothing, but removing the class name too keeps the JSX honest about what's actually happening.)

- [ ] **Step 2: Update Onboarding.tsx's header banner**

In `src/pages/Onboarding.tsx`, change:

```tsx
      <div className="gradient-hero px-6 pt-12 pb-8 text-primary-foreground safe-area-top">
```

to:

```tsx
      <div className="gradient-primary px-6 pt-12 pb-8 text-primary-foreground safe-area-top">
```

- [ ] **Step 3: Update ProfileHeader.tsx's profile card**

In `src/components/profile/ProfileHeader.tsx`, change:

```tsx
  <div className="gradient-hero rounded-2xl p-6 text-center text-primary-foreground shadow-elevated">
```

to:

```tsx
  <div className="gradient-primary rounded-xl p-6 text-center text-primary-foreground">
```

- [ ] **Step 4: Build to verify**

Run: `npm run build`
Expected: succeeds, no TypeScript/JSX errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Onboarding.tsx src/components/profile/ProfileHeader.tsx
git commit -m "feat: use flat primary blue for brand panels instead of gradient-hero's info blue"
```

---

### Task 4: Normalize border radius (`rounded-2xl` → `rounded-xl`) on the remaining sites

**Files:**
- Modify: `src/pages/TaxCalculator.tsx:89`
- Modify: `src/pages/Dashboard.tsx:68` (the audit-request banner — separate from the CTA already changed in Task 3)
- Modify: `src/pages/SubmissionDetail.tsx:216,233,248,262,293,354`
- Modify: `src/components/declaration/ReviewStep.tsx:49`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new for other tasks.

The template never uses a radius larger than 12px (`rounded-xl` in this codebase's scale, since `--radius` is now 12px). This is the remaining set of `rounded-2xl` (16px) instances not already handled by Task 3. No automated test — pure className changes, verified via `npm run build` and a final grep (Step 8) confirming zero `rounded-2xl` remain anywhere in `src/`.

- [ ] **Step 1: TaxCalculator.tsx**

Change:

```tsx
          className="gradient-hero rounded-2xl p-5 text-primary-foreground shadow-elevated space-y-4"
```

to:

```tsx
          className="gradient-hero rounded-xl p-5 text-primary-foreground space-y-4"
```

(`gradient-hero` stays as-is here — this is a tax-estimate result panel, the correct site for the new info-blue color. Only the radius and the dead `shadow-elevated` class name change.)

- [ ] **Step 2: Dashboard.tsx audit banner**

Change:

```tsx
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3"
```

to:

```tsx
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3"
```

- [ ] **Step 3: SubmissionDetail.tsx — six sites**

Change each of the following (all in `src/pages/SubmissionDetail.tsx`):

```tsx
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-2"
```
to
```tsx
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2"
```

```tsx
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
```
(appears three times, at the "Documents", a second section, and a third section — change all three occurrences)
to
```tsx
      <div className="bg-card rounded-xl p-4 space-y-3">
```
(`shadow-card` class removed along with the radius change, since Task 1 already made it render nothing — same rationale as Task 3's `shadow-elevated` removal.)

```tsx
        className="w-full flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card hover:shadow-elevated transition-shadow text-left"
```
to
```tsx
        className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border transition-colors text-left"
```
(`hover:shadow-elevated transition-shadow` → `border border-border transition-colors` — the template's cards get their definition from a border, not a shadow, so this hover state needs an actual replacement affordance, not just a removed class. A `border-primary` hover or similar can be refined visually, but a plain border is the correct minimum to match the template's card language.)

```tsx
                    "rounded-2xl p-4 space-y-4",
```
(inside a `cn(...)` call — this is a ternary/conditional class list) — change to:
```tsx
                    "rounded-xl p-4 space-y-4",
```

- [ ] **Step 4: ReviewStep.tsx**

Change:

```tsx
        <div className="gradient-hero rounded-2xl p-5 text-primary-foreground shadow-elevated space-y-4">
```

to:

```tsx
        <div className="gradient-hero rounded-xl p-5 text-primary-foreground space-y-4">
```

(Same reasoning as TaxCalculator.tsx Step 1 — this is the other tax-result panel; `gradient-hero`'s new info-blue is correct here.)

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Verify no `rounded-2xl` remains**

Run: `grep -rn "rounded-2xl" src/`
Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add src/pages/TaxCalculator.tsx src/pages/Dashboard.tsx src/pages/SubmissionDetail.tsx src/components/declaration/ReviewStep.tsx
git commit -m "feat: normalize border radius to match the template's 12px max"
```

---

### Task 5: Flat tinted background for the active bottom-nav tab

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`

**Interfaces:**
- Consumes: `--primary-tint` (`#E7F1F6`, from Task 1).
- Produces: nothing new for other tasks.

The template's active-nav treatment is a light tint background (`#E7F1F6`) with primary-colored text/icon — not a solid primary fill (that's reserved for buttons). This is visually distinct from the generic `gradient-primary` flattening in Task 1, so it needs its own explicit change. No automated test — pure className change. Verified via `npm run build` and Task 8's manual pass (confirm the active tab looks like a light blue pill, not a solid dark blue one).

- [ ] **Step 1: Update the active-tab styling**

In `src/components/layout/BottomNav.tsx`, change:

```tsx
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "gradient-primary shadow-card"
                    : "group-hover:bg-muted"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                />
              </div>
```

to:

```tsx
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[var(--primary-tint)]"
                    : "group-hover:bg-muted"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
```

(`text-primary-foreground` → `text-primary`, since the icon now sits on a light tint background, not a solid dark one — white text on `#E7F1F6` would be nearly invisible.)

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "feat: use a flat tinted background for the active nav tab, matching the template"
```

---

### Task 6: Add a `success` variant to StatCard and correct the Approved stat's color

**Files:**
- Modify: `src/components/dashboard/StatCard.tsx`
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `--success`/`--success-foreground` (from Task 1).
- Produces: `StatCardProps.variant` now includes `"success"`, consumed by `Dashboard.tsx`'s "Approved" stat card in this same task.

The template colors its "Approved" stat card green (success semantics), not blue — the current code uses `variant="primary"` (blue) for that card, a semantic mismatch worth correcting as part of matching the template, not just recoloring what's already there. No automated test — `StatCard` has no existing test file and this is a rendering/prop change, not new business logic. Verified via `npm run build` and a visual check.

- [ ] **Step 1: Extend StatCard's variant type and rendering**

In `src/components/dashboard/StatCard.tsx`, change:

```tsx
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "primary" | "accent";
}

const StatCard = ({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4 shadow-card transition-all hover:shadow-elevated",
        variant === "primary" && "gradient-primary text-primary-foreground",
        variant === "accent" && "gradient-accent text-accent-foreground",
        variant === "default" && "bg-card text-card-foreground"
      )}
    >
```

to:

```tsx
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "primary" | "accent" | "success";
}

const StatCard = ({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4 border border-border transition-all",
        variant === "primary" && "gradient-primary text-primary-foreground border-transparent",
        variant === "accent" && "gradient-accent text-accent-foreground border-transparent",
        variant === "success" && "bg-success text-success-foreground border-transparent",
        variant === "default" && "bg-card text-card-foreground"
      )}
    >
```

(`shadow-card transition-all hover:shadow-elevated` → `border border-border transition-all`, matching the template's border-only card separation; `border-transparent` on the colored variants since they don't need the neutral border.)

- [ ] **Step 2: Use the new variant for the Approved stat**

In `src/pages/Dashboard.tsx`, change:

```tsx
        <StatCard icon={TrendingUp} label="Approved" value={String(approved)} subtitle={`${declarations.length ? Math.round((approved / declarations.length) * 100) : 0}% success`} variant="primary" />
```

to:

```tsx
        <StatCard icon={TrendingUp} label="Approved" value={String(approved)} subtitle={`${declarations.length ? Math.round((approved / declarations.length) * 100) : 0}% success`} variant="success" />
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/StatCard.tsx src/pages/Dashboard.tsx
git commit -m "feat: add success variant to StatCard, matching the template's green Approved stat"
```

---

### Task 7: Rename the app's display name to FileSmart

**Files:**
- Modify: `capacitor.config.ts`
- Modify: `src/components/layout/TopBar.tsx`
- Modify: `src/pages/Onboarding.tsx`
- Modify: `src/lib/filing-summary.ts`
- Modify: `index.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new for other tasks.

Per the spec's explicit exclusions: this task does NOT touch `src/lib/local-db.ts`'s Dexie database name or `capacitor.config.ts`'s `appId` — only user-visible display text. No automated test — checked `src/lib/filing-summary.test.ts` for any assertion on the exact guidance string (none asserts the literal "TaxEase" substring, only that it `.toContain("firs")` case-insensitively, so this change doesn't break it). Verified via `npm run build`, `npm run test`, and a visual/text check.

- [ ] **Step 1: capacitor.config.ts**

Change:

```ts
  appName: 'TaxEase Africa',
```

to:

```ts
  appName: 'FileSmart',
```

- [ ] **Step 2: TopBar.tsx**

Change:

```tsx
  const title = pageTitles[location.pathname] || "TaxEase";
```

to:

```tsx
  const title = pageTitles[location.pathname] || "FileSmart";
```

Change:

```tsx
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">TaxEase Africa</p>
```

to:

```tsx
          <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase">FileSmart</p>
```

- [ ] **Step 3: Onboarding.tsx**

Change:

```tsx
        toast({ title: "Profile created!", description: "Welcome to TaxEase Africa" });
```

to:

```tsx
        toast({ title: "Profile created!", description: "Welcome to FileSmart" });
```

- [ ] **Step 4: filing-summary.ts**

Change:

```ts
  "TaxEase does not yet have a direct filing integration with the Federal " +
```

to:

```ts
  "FileSmart does not yet have a direct filing integration with the Federal " +
```

- [ ] **Step 5: index.html**

Change:

```html
    <title>Lovable App</title>
```

to:

```html
    <title>FileSmart</title>
```

Change:

```html
    <meta property="og:title" content="Lovable App" />
```

to:

```html
    <meta property="og:title" content="FileSmart" />
```

(Also remove the two now-stale `<!-- TODO: ... -->` comments immediately above each of these lines, since the TODO is now done.)

- [ ] **Step 6: package.json**

Change:

```json
  "name": "vite_react_shadcn_ts",
```

to:

```json
  "name": "filesmart",
```

- [ ] **Step 7: Run the full test suite and build**

Run: `npm run test && npm run build`
Expected: all tests pass (including `filing-summary.test.ts`'s existing guidance-text assertion, which checks `.toContain("firs")` case-insensitively and is unaffected by the "TaxEase"→"FileSmart" change); build succeeds.

- [ ] **Step 8: Commit**

```bash
git add capacitor.config.ts src/components/layout/TopBar.tsx src/pages/Onboarding.tsx src/lib/filing-summary.ts index.html package.json
git commit -m "feat: rename app display name to FileSmart"
```

---

### Task 8: Dashboard restructure — time-of-day greeting and evergreen tip card

**Files:**
- Create: `src/lib/greeting.ts`
- Create: `src/lib/greeting.test.ts`
- Modify: `src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `getGreeting(hour: number): string`, consumed by `Dashboard.tsx` in this same task.

This is the one piece of genuinely new, pure logic in the whole reskin (a time-of-day → greeting-word mapping) — TDD applies here, unlike the rest of this plan's pure styling changes.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/greeting.test.ts
import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns a morning greeting before noon", () => {
    expect(getGreeting(6)).toBe("Good morning");
    expect(getGreeting(11)).toBe("Good morning");
  });

  it("returns an afternoon greeting from noon until 5pm", () => {
    expect(getGreeting(12)).toBe("Good afternoon");
    expect(getGreeting(16)).toBe("Good afternoon");
  });

  it("returns an evening greeting from 5pm onward, including late night", () => {
    expect(getGreeting(17)).toBe("Good evening");
    expect(getGreeting(23)).toBe("Good evening");
    expect(getGreeting(0)).toBe("Good evening");
    expect(getGreeting(4)).toBe("Good evening");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/greeting.test.ts`
Expected: FAIL — `Failed to resolve import "./greeting"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/greeting.ts
/** Maps an hour (0-23, local time) to a time-of-day greeting word. */
export function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/greeting.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire the greeting and add the evergreen tip card**

In `src/pages/Dashboard.tsx`, change the import line:

```tsx
import { FilePlus, TrendingUp, FileCheck, DollarSign, ArrowRight, Calculator, RefreshCw, AlertTriangle, Upload } from "lucide-react";
```

to:

```tsx
import { FilePlus, TrendingUp, FileCheck, DollarSign, ArrowRight, Calculator, RefreshCw, AlertTriangle, Upload, ShieldCheck } from "lucide-react";
import { getGreeting } from "@/lib/greeting";
```

Change the "Welcome" block:

```tsx
      {/* Welcome */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back,</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {profile?.name || "Loading..."}
          </h2>
        </div>
```

to:

```tsx
      {/* Welcome */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{getGreeting(new Date().getHours())},</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {profile?.name || "Loading..."}
          </h2>
        </div>
```

Change the end of the "Recent" section (add the tip card immediately after it, before the closing `</motion.div>` of the component):

```tsx
          {recentSubmissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={{
                id: sub.id,
                taxYear: sub.taxYear,
                type: sub.type,
                status: sub.status as any,
                date: new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                amount: sub.amount || "—",
              }}
              onClick={() => navigate(`/submissions/${sub.id}`)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
```

to:

```tsx
          {recentSubmissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={{
                id: sub.id,
                taxYear: sub.taxYear,
                type: sub.type,
                status: sub.status as any,
                date: new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                amount: sub.amount || "—",
              }}
              onClick={() => navigate(`/submissions/${sub.id}`)}
            />
          ))}
        </div>
      </motion.div>

      {/* Tip */}
      <motion.div variants={item} className="bg-[var(--info-bg)] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">Tip</p>
        </div>
        <p className="text-lg font-display font-bold text-foreground leading-tight">Documents matter</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Attaching payslips and financial statements to your filing helps avoid audit requests, and stays
          securely encrypted on your device.
        </p>
      </motion.div>
    </motion.div>
  );
};
```

- [ ] **Step 6: Run the full test suite and build**

Run: `npm run test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/greeting.ts src/lib/greeting.test.ts src/pages/Dashboard.tsx
git commit -m "feat: add time-of-day greeting and evergreen documents tip to Dashboard"
```

---

## Final verification (after all tasks)

- [ ] Run: `npm run test` — expect all tests passing, including the 3 new `greeting.test.ts` cases, with zero regressions in the untouched suite.
- [ ] Run: `npm run build` — expect success.
- [ ] Run: `npm run lint` — expect the pre-existing baseline (17 errors / 9 warnings as of the most recent merged PR) with no new errors introduced by this plan's files.
- [ ] Run: `grep -rn "rounded-2xl" src/` — expect zero matches (confirms the radius sweep is complete).
- [ ] Run: `grep -rln "TaxEase" src/ index.html capacitor.config.ts package.json` — expect exactly three files: `src/lib/local-db.ts` (the deliberate, documented `TaxEaseAfrica` Dexie name exception, including its `TaxEaseDB` class identifier), `src/lib/local-db.test.ts`, and `src/lib/document-storage.test.ts` (both correctly pin the unchanged Dexie name via `indexedDB.open("TaxEaseAfrica")`). Any other file appearing here is a missed rename site, not an expected exception.
- [ ] Manual smoke check (not automated): start the dev server, walk through every screen (Login, Onboarding, Dashboard, New Declaration wizard's 7 steps, Submissions, Submission Detail, Tax Calculator, Profile) in both light and dark mode. Confirm: no gradients or shadows anywhere, system font rendering, consistent 12px-max radius, the bottom nav's active tab shows a light blue tint (not solid blue), the Approved stat card is green, the Dashboard shows a time-appropriate greeting and the new tip card, and selecting Nigeria in the wizard's Country step does not change the app's colors.
