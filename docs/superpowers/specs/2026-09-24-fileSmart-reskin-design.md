# FileSmart-Inspired Reskin — Design

## Context

The user shared a Claude Design artifact ("FileSmart Dashboard") and asked to apply it to TaxEase's frontend. The artifact is a desktop web dashboard (220px sidebar nav, two-column grids, max-width 1100px) with a distinct visual language — flat blue (`#0A5C8A`) brand color, neutral gray-blue palette, system fonts, no gradients, no shadows, 8px/12px border radii. TaxEase today is a Capacitor mobile app: single-column screens, 5-item bottom-tab nav, shadcn/ui + Tailwind CSS-variable theming, custom Google Fonts (Space Grotesk + Plus Jakarta Sans), and heavy gradient usage (`gradient-hero`/`gradient-primary`/`gradient-accent`) in a warm green/gold "African-inspired" palette.

**Scope, confirmed with the user across several decisions:**
- **Reskin, not restructure.** Existing mobile navigation (bottom tabs) and screen structure stay exactly as they are. No sidebar, no desktop layout, no new screens (Estimator/Messages/Payments from the template are not being added — TaxEase already has an equivalent Tax Calculator screen).
- **One exception**: the Dashboard screen's content gets restructured to mirror the template's information architecture — though this turns out to be a small change, since Dashboard.tsx already has nearly identical structure (2 CTA cards, 4 stat cards, Recent Submissions list).
- **Full visual match**, not a color-only swap: system fonts (dropping the Google Fonts dependency), flat cards (no gradients, no shadows — border-only separation), radius scale matched to the template.
- **Dark mode**: derive a coherent dark variant of the new palette (not left mismatched, not copied from anywhere — the template has no dark mode to copy).
- **Country-flag theming system retired.** `CountryThemeContext.tsx` currently overwrites `--primary`/`--accent`/`--success`/`--warning`/gradient CSS variables at runtime per selected country (distinct palette per African country). Left as-is, this would silently undo the reskin the instant a user passes through the wizard's Country step. Since only Nigeria is reachable today (the other 7 countries are `active: false`) and the template establishes one coherent brand identity rather than a per-market skin, this dynamic overwriting is removed. The underlying `country`/`setCountry` *selection* state (used by `Profile.tsx`/`CountrySelector.tsx` independent of theming) is kept — only the CSS-variable side effect and the per-country color data are removed.

## Color system

**Storage format changes**: from bare HSL components (`--primary: 152 55% 28%`, wrapped as `hsl(var(--primary))` in Tailwind) to complete color values (`--primary: #0A5C8A`, referenced as bare `var(--primary)`). This is a deliberate correctness choice: the template's status colors are defined in `oklch()`, which cannot be losslessly hand-converted to HSL. Storing full values means every token is copied byte-for-byte from the source design — zero approximation error — and status colors can use `oklch()` directly. `oklch()` has shipped in Android WebView and iOS WKWebView since 2022–2023, safe for a 2026 app.

**Light palette** (every value copied directly from the template's markup):

| Token | Value |
|---|---|
| `--background` | `#F5F7F8` |
| `--card` | `#FFFFFF` |
| `--foreground` | `#1A2530` |
| `--muted-foreground` | `#5B6B76` |
| `--muted-foreground-2` (new token) | `#8B98A2` |
| `--border` | `#E4E8EB` |
| `--input` | `#D8DEE2` |
| `--primary` | `#0A5C8A` |
| `--ring` | `#0A5C8A` |
| `--success` | `oklch(45% 0.09 150)` |
| `--success-bg` (new token, for tinted backgrounds) | `oklch(96% 0.02 150)` |
| `--warning` | `oklch(58% 0.12 70)` |
| `--warning-bg` (new token) | `oklch(96% 0.02 70)` |
| `--info` | `oklch(45% 0.09 230)` |
| `--info-bg` (new token) | `oklch(96% 0.015 230)` |
| `--destructive` | unchanged — template has no error/destructive example |

**Dark palette**: derived (not copied) by applying the same lightness/contrast relationships the light palette establishes — dark background in the `#0F1721` range, card surfaces one step lighter (`#16202B` range), primary blue lightened for AA contrast against the dark background, borders and muted text adjusted proportionally. Exact hex values are finalized during implementation and checked against WCAG AA contrast ratios (4.5:1 body text, 3:1 large text/UI), not guessed.

## Typography, radius, shadows, gradients

- **Fonts**: remove the Google Fonts `@import` for Space Grotesk/Plus Jakarta Sans. Both `font-display` and `font-body` Tailwind font families become `-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif` (matching the template; it doesn't distinguish a separate display face).
- **Radius**: `--radius` changes to `0.75rem` (12px, for cards) with buttons/inputs at 8px, matching the template's actual scale. Every hardcoded `rounded-2xl` (16px) in components steps down — the template never exceeds 12px anywhere.
- **Shadows**: `shadow-card`/`shadow-elevated` utilities and their call sites are removed from standard cards. The template separates cards with a `1px solid var(--border)` only — no drop shadow, anywhere, including on primary CTA buttons.
- **Gradients removed**: `gradient-primary`/`gradient-accent`/`gradient-hero` utility classes (defined in `index.css`) and all 18 call sites (see Scope below) become flat single colors — `bg-primary` for primary actions, the new warning-amber for secondary/accent actions, matching the template's flat-card treatment.

## Scope — files touched

**Global tokens** (`src/index.css`, `tailwind.config.ts`): color variable rewrite per above, font-family change, radius change, gradient utility removal, dark-mode block rewrite.

**Gradient/shadow call sites** (18 files, found via `grep -rl "gradient-\(primary\|accent\|hero\)" src/`): `SubmissionDetail.tsx`, `ReviewStep.tsx`, `NewDeclaration.tsx`, `CountryStep.tsx`, `Onboarding.tsx`, `Login.tsx`, `DocumentsStep.tsx`, `Submissions.tsx`, `TaxCalculator.tsx`, `Dashboard.tsx`, `EarnedIncomeStep.tsx`, `BottomNav.tsx`, `CountrySelector.tsx`, `CountryThemeContext.tsx` (removed, not recolored — see below), `StepIndicator.tsx`, `StatCard.tsx`, `ProfileHeader.tsx`, plus `index.css` itself. Each call site's gradient class becomes a flat equivalent; `rounded-2xl` in the same files steps down per the radius change.

**`BottomNav.tsx`**: active-tab background changes from `gradient-primary` to a flat tinted background (`#E7F1F6`-equivalent, i.e. `bg-primary/10` or the literal token), matching the template's active-nav treatment exactly.

**`CountryThemeContext.tsx`**: `applyTheme()`'s `root.style.setProperty(...)` calls and the `themes` per-country color-data object are removed. `country`/`setCountry` state (backed by `localStorage`) is kept unchanged — `Profile.tsx`, `CountrySelector.tsx`, and `CountryStep.tsx`'s consumption of `country`/`setCountry` for *selection* (not theming) is unaffected. File/hook/provider names (`CountryThemeContext`, `useCountryTheme`, `CountryThemeProvider`) are kept as-is to avoid an unrelated rename touching 4 additional call sites — the "Theme" in the name becomes a minor, acknowledged misnomer rather than triggering a broader refactor.

**`Dashboard.tsx`**: time-of-day greeting (`new Date().getHours()` → morning/afternoon/evening, real profile name — not hardcoded), recolor of existing CTA/stat/list elements (structure unchanged), new evergreen tip card below Recent Submissions:

> "Documents matter — Attaching payslips and financial statements to your filing helps avoid audit requests, and stays securely on your device."

No fabricated "news" content (there's no backend source for real tax-news updates) — this is a static, always-true statement about a feature that already exists (`document-storage.ts`'s on-device encryption, established in Phase 1).

**`StatCard.tsx`**: checked during implementation for whether its existing `variant` prop already supports a solid-fill treatment (template's "Approved"/"Pending" cards are solid-color-filled, not just colored icons on a white card) — extended if not.

## App name change (added after initial spec approval)

The user asked, mid-implementation-planning, to also rename the app's displayed name from "TaxEase Africa" to "FileSmart," matching the design template's own branding. Scope, decided by the same reversibility principle as the rest of this spec — safe/cosmetic changes proceed, anything that could silently affect existing users or store registration is called out rather than done quietly:

**Renamed** (purely display text, zero data/registration risk):
- `capacitor.config.ts`: `appName: 'TaxEase Africa'` → `'FileSmart'` (the OS-level app-switcher/home-screen label).
- `src/components/layout/TopBar.tsx`: the eyebrow label `"TaxEase Africa"` and the fallback page title `"TaxEase"` → `"FileSmart"`.
- `src/pages/Onboarding.tsx`: toast text `"Welcome to TaxEase Africa"` → `"Welcome to FileSmart"`.
- `src/lib/filing-summary.ts`: the exported filing-summary guidance text's `"TaxEase does not yet have..."` → `"FileSmart does not yet have..."`.
- `index.html`: `<title>` and `og:title` — these were never actually customized past the original Lovable scaffold placeholder (`"Lovable App"`), a pre-existing gap; setting them to `"FileSmart"` now completes the rebrand rather than leaving an inconsistent browser-tab title.
- `package.json`: `"name": "vite_react_shadcn_ts"` (the original scaffold's internal package identifier, not user-facing, but worth completing) → `"filesmart"`.

**Deliberately NOT renamed, and why:**
- `src/lib/local-db.ts:108` — `super("TaxEaseAfrica")` is the literal Dexie/IndexedDB database name. Changing this string makes Dexie open a **new, empty** database on next launch — every existing user's locally-stored declarations, profile, and encrypted documents would appear to vanish (the old database would still physically exist on-device, just never opened again). This is a real, silent-data-loss risk with no plausible reading of "change the app name" implying "and also risk wiping local user data." Left untouched.
- `capacitor.config.ts`'s `appId` (`'app.lovable.cfccb7e81e944850aec55d58ce74fa8e'`) — the app's bundle identifier, a distinct concern from its display name. It's still the original Lovable placeholder and was never registered to a real App Store/Play Console listing (per the file's own pre-existing TODO comment), so there's no store-continuity risk today — but choosing a real, owned bundle ID is its own deliberate decision for whenever the app is actually submitted, not implied by a display-name change. Left untouched.

## Out of scope

- Navigation structure (bottom tabs stay; no sidebar, no drawer).
- New screens (Estimator/Messages/Payments from the template aren't being added).
- Updating the other 7 (still-inactive) countries' color data — moot now that the mechanism reading it is removed; if per-country theming is ever wanted again, it starts fresh, not from this removed data.
- Exact dark-mode hex values (derived during implementation, contrast-checked, not specified to the pixel in this spec).

## Testing

This is a CSS/visual-styling change with no new business logic — no new unit tests are warranted (nothing here has an isolable pure-function behavior to assert on). Verification is: `npm run build` (catches any TypeScript errors from removed exports, e.g. if `applyTheme` or `themes` were imported elsewhere — confirmed via grep above that they aren't), `npm run test` (existing suite must stay green — no test currently asserts on gradient classes or exact color values, confirmed by grep), and a manual visual pass through every screen (Dashboard, Declaration wizard all 7 steps, Submissions, Submission Detail, Tax Calculator, Profile, Login, Onboarding) checking both light and dark mode, plus explicit confirmation that selecting Nigeria in the wizard's Country step no longer alters the color scheme.
