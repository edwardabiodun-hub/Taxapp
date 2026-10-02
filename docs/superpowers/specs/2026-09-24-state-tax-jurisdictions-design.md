# State-Specific Tax Jurisdictions — Design

## Context

TaxEase Africa currently computes tax with a single federal function, `calculateNigeriaTax()` (`src/lib/tax-calculator.ts`), and has no concept of "state" anywhere — not on the profile, not on a declaration, not in the Supabase schema, not in the UI. The original technical audit flagged Lagos/Ogun/Oyo/Osun state-specific logic as unbuilt; this spec designs how it gets built.

**Decision from the user:** Phase 1 launches with Lagos, Ogun, Oyo, and Osun. The specific ways those four states' tax rules differ from the federal baseline (and from each other) are **not yet determined** — there's no confirmed source of truth for the exceptions today. The architecture must therefore make adding a real, cited exception a small, isolated change whenever it's confirmed, without forcing a redesign — and must scale cleanly to all 36 states + FCT after launch.

## Decisions made during design

1. **State lives on the declaration, not the profile.** State of residence as of Jan 1 determines which state IRS a filer files with for that tax year — a per-filing fact, not a fixed user attribute. This correctly handles a user relocating between filing years with no later migration needed.
2. **Delta/override layer on the existing federal engine**, not independent per-state calculators or a DB-backed config table. Nigerian PIT bands, CRA relief, and the minimum-tax rule are federal law (PITA) that states administer — `calculateNigeriaTax()` is correct for every state as the shared baseline. States add only optional, isolated overrides where a real exception is confirmed; a state with none (all four launch states, today) needs no override code at all.
   - Rejected: independent per-state calculators (duplicates the "nearly identical" logic up to 37 times, real drift risk on a federal rate change).
   - Rejected for now: DB-backed, admin-editable jurisdiction config (real value at true 36-state scale — avoids app-store redeploy lag for a rate change — but a materially bigger build: a tax-rules config schema expressive enough for real formulas, plus an admin review/audit process for compliance-critical numbers. Nothing today justifies that complexity; the delta-layer design is a strict subset that can migrate to this later without a rewrite if the pain materializes).

## Architecture

### Tax engine (`src/lib/tax/`, new directory)

`tax-calculator.ts` is **not modified** — it remains the tested, federal-baseline engine every state starts from.

**`src/lib/tax/jurisdictions.ts`** — the registry:

```ts
import type { NigeriaDeclarationForm } from "@/types/declaration";
import type { TaxBreakdown } from "@/lib/tax-calculator";

export interface StateJurisdiction {
  code: string; // "lagos"
  overrides?: {
    /** Additional state-level levies, each citing its legal basis the same
     * way TAX_BANDS cites PITA. Summed into finalTax by state-tax.ts. */
    levies?: (breakdown: TaxBreakdown, form: NigeriaDeclarationForm) => { label: string; amount: number }[];
    /** Replaces the federal CRA/relief computation for this state only, if
     * its SIRS is ever confirmed to apply a different formula. */
    reliefOverride?: (grossIncome: number, form: NigeriaDeclarationForm) => number;
  };
}

// A state with no confirmed exceptions is a one-line entry — pure federal
// baseline. Do not add empty {overrides: {}} objects; omit `overrides`
// entirely so it's obvious at a glance which states have real exceptions.
export const JURISDICTIONS: Record<string, StateJurisdiction> = {
  lagos: { code: "lagos" },
  ogun: { code: "ogun" },
  oyo: { code: "oyo" },
  osun: { code: "osun" },
};
```

**`src/lib/tax/state-tax.ts`** — the orchestrator:

```ts
export interface StateTaxBreakdown extends TaxBreakdown {
  stateLevies: { label: string; amount: number }[];
}

export function calculateStateTax(form: NigeriaDeclarationForm, stateCode: string): StateTaxBreakdown {
  const federal = calculateNigeriaTax(form);
  const jurisdiction = JURISDICTIONS[stateCode];
  if (!jurisdiction?.overrides) {
    return { ...federal, stateLevies: [] };
  }
  // apply reliefOverride (if present) by recomputing taxableIncome/bands,
  // then apply levies on top of the (possibly relief-adjusted) finalTax.
  // ... (full arithmetic detailed in the implementation plan, not this spec)
}
```

Unknown/unregistered state codes (including declarations created before this feature existed, which have no `state` value) fall through to pure federal baseline — this function never throws on a missing/unrecognized code.

### Data model

- **`src/lib/local-db.ts`** — `LocalDeclaration.state: string` (new field). Bump Dexie schema version (mirrors the pattern used for every prior schema change, e.g. `activities.pendingSync` in the v7→v8 bump). Existing local declarations simply have no `state` value; treated as "no jurisdiction selected" wherever read, never as an error.
- **Supabase migration** — `alter table public.declarations add column state text;` (nullable — no backfill needed; existing rows correctly have no state). Included in `api.ts`'s `pushDeclarationsToServer`/`fetchDeclarationsFromServer` row mapping, same convention as `tax_year`.
- **`src/types/declaration.ts`**:
  - `NigeriaDeclarationForm.state: string` (default `""`).
  - New `nigerianStates: StateOption[]`, structurally identical to the existing `africanCountries` (`{ code, name, active }`): Lagos, Ogun, Oyo, Osun → `active: true`; the remaining 32 states + FCT → `active: false`. Flipping a flag later is the entire mechanism for "scale to national scope" — no architecture change, identical to how a new country activates today.

### UI

- **`CountryStep.tsx`** — extended (not replaced) with a state-picker grid shown directly beneath the country grid whenever `form.country === "ng"`, reusing the exact active/locked card visual pattern already implemented for countries (`Lock` icon + "Coming soon" for `active: false` entries). No new wizard step; `declarationSteps` is unchanged.
- **`validation.ts`** — step 0 gains: state required when `form.country === "ng"`.
- **`NewDeclaration.tsx`** — `handleSubmit` calls `calculateStateTax(form, form.state)` instead of `calculateNigeriaTax(form)`; passes `state: form.state` into the declaration it saves.
- **`filing-summary.ts`** — includes the filed state in the generated summary, so the document names which SIRS it's actually for (currently only generic boilerplate).
- **`ReviewStep.tsx`** / **`SubmissionDetail.tsx`** — display the selected state alongside the existing tax-year/country display, same read-only pattern already used there.

## Testing

- **`state-tax.test.ts`** (new) — the orchestrator: falls through to federal baseline for all four launch states (since none has overrides yet) and for an unknown code; a synthetic jurisdiction with a levy override actually adds to `finalTax` and appears in `stateLevies` (proves the mechanism works, using a test-only fixture jurisdiction rather than waiting on real Lagos numbers).
- **`jurisdictions.test.ts`** (new) — registry shape: all four launch codes present, no unintended `overrides` on any of them today (this test is the guardrail that stops a well-meaning future edit from silently attaching an unconfirmed override).
- **`validation.test.ts`** (if one doesn't already exist — check during implementation) — state-required rule for `country === "ng"`.
- No changes needed to existing `tax-calculator.test.ts` — the federal engine is untouched.

## Out of scope for this spec

- The actual confirmed tax exceptions for Lagos/Ogun/Oyo/Osun (none are known yet — this spec builds the mechanism, not the numbers).
- Expanding beyond these four states (mechanism supports it via the `active` flag and a new `JURISDICTIONS` entry; doing so is a future, much smaller change, not part of this implementation).
- Any DB-backed/admin-editable config system (rejected for now; see Decisions above).
