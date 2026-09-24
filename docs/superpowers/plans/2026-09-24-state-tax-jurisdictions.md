# State-Specific Tax Jurisdictions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a declaration be filed for a specific Nigerian state (Lagos, Ogun, Oyo, or Osun at launch), with tax computed via a shared federal engine plus optional, isolated per-state overrides, structured so activating the remaining 32 states + FCT later is a data-only change.

**Architecture:** A new `src/lib/tax/` module adds a jurisdiction registry (`jurisdictions.ts`) and a thin orchestrator (`state-tax.ts`) that calls the existing, untouched `calculateNigeriaTax()` and layers a state's `overrides` (additional levies, or a replaced final-tax formula) on top when present. `state` becomes a per-declaration field (not a profile field), threaded through local storage, Supabase, and the wizard UI the same way `taxYear` already is.

**Tech Stack:** TypeScript, React, Dexie (IndexedDB), Supabase Postgres, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-24-state-tax-jurisdictions-design.md`

**Deviation from the spec, and why:** the spec's `StateJurisdiction.overrides` included a `reliefOverride` hook that would recompute taxable income and re-run the federal band table. Implementing that for real (not a stub) would require either exporting `tax-calculator.ts`'s private band-application loop — contradicting the spec's own "`tax-calculator.ts` is not modified" constraint — or duplicating that loop in `state-tax.ts`, which is exactly the drift risk the spec rejected "Approach B" (independent per-state calculators) for. This plan replaces it with `finalTaxOverride?: (federal: TaxBreakdown, form) => number`, which serves the same real-world purpose (a state whose SIRS is confirmed to compute final liability by a genuinely different formula) but is fully implementable today without touching the federal engine. No launch state uses either hook yet, so this changes no behavior — only the shape of an as-yet-unused extension point. Flag this to Eddie when the plan is reviewed.

## Global Constraints

- `src/lib/tax-calculator.ts` is not modified by this plan — it remains the tested, federal-baseline engine every state starts from.
- State lives on the declaration (`LocalDeclaration.state`, `declarations.state`), not the profile — a per-filing fact, not a fixed user attribute.
- A state with no confirmed exceptions gets a bare `{ code }` registry entry — never an empty `{ overrides: {} }` placeholder. This is what keeps "nearly identical" cheap.
- `calculateStateTax()` never throws on a missing or unrecognized state code (including declarations that predate this feature) — it falls through to the pure federal baseline.
- No DB-backed/admin-editable jurisdiction config in this implementation (spec: rejected for now).
- Activating a new state later is a data-only change: add a `nigerianStates` entry with `active: true` (and, only if a real exception is confirmed, a `JURISDICTIONS` entry) — no architecture change.

## Review Focus

1. **A declaration with no `state` value** (created before this feature existed) must still compute, display, and export correctly — never crash, never silently mis-tax. Covered by Task 2's empty-string/unrecognized-code tests and Task 11's "falls through cleanly" test.
2. **A non-Nigeria country** must never be blocked by the new state-required validation rule, since only Nigeria has any active states today and other countries may activate later without states of their own. Covered by Task 5's `country: "ke"` test.
3. **The inactive-state lock in the picker UI** must behave identically to the already-shipped country picker's lock (disabled, unselectable, "Coming soon") — this reuses that exact pattern rather than reimplementing it, so the risk is low, but there is no automated test for the picker itself (no existing precedent for wizard-step component tests in this codebase — verified via `npm run build` only). Flagged here rather than silently assumed safe.
4. **Two states accidentally sharing a code, or the wrong four marked active** — a data-entry mistake in a 37-entry array is easy to make silently. Covered by Task 3's uniqueness and exact-active-set guardrail tests.
5. **Multiple state levies summed with kobo-precision rounding** — an additive-levy state with more than one levy must sum and round correctly, not just handle the single-levy case. Covered by Task 2's multi-levy rounding test.

---

### Task 1: Tax jurisdiction registry

**Files:**
- Create: `src/lib/tax/jurisdictions.ts`
- Test: `src/lib/tax/jurisdictions.test.ts`

**Interfaces:**
- Consumes: `TaxBreakdown` from `src/lib/tax-calculator.ts` (existing, exported), `NigeriaDeclarationForm` from `src/types/declaration.ts` (existing, exported).
- Produces: `StateJurisdiction` interface and `JURISDICTIONS: Record<string, StateJurisdiction>`, both exported for Task 2 (`state-tax.ts`) to consume.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tax/jurisdictions.test.ts
import { describe, it, expect } from "vitest";
import { JURISDICTIONS } from "./jurisdictions";

describe("JURISDICTIONS", () => {
  it("registers exactly the four launch states", () => {
    expect(Object.keys(JURISDICTIONS).sort()).toEqual(["lagos", "ogun", "osun", "oyo"]);
  });

  it("has no overrides on any launch state yet, since none has a confirmed exception", () => {
    for (const jurisdiction of Object.values(JURISDICTIONS)) {
      expect(jurisdiction.overrides).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tax/jurisdictions.test.ts`
Expected: FAIL — `Failed to resolve import "./jurisdictions"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/tax/jurisdictions.ts
import type { TaxBreakdown } from "@/lib/tax-calculator";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface StateJurisdiction {
  code: string; // "lagos"
  overrides?: {
    /** Additional state-level levies, each citing its legal basis the same
     * way tax-calculator.ts's TAX_BANDS cites PITA. Summed into finalTax by
     * state-tax.ts's calculateStateTax(). */
    levies?: (federal: TaxBreakdown, form: NigeriaDeclarationForm) => { label: string; amount: number }[];
    /** Replaces the federal finalTax entirely for this state, if its SIRS is
     * ever confirmed to compute final liability by a genuinely different
     * formula rather than an additive levy. Applied before levies. */
    finalTaxOverride?: (federal: TaxBreakdown, form: NigeriaDeclarationForm) => number;
  };
}

// A state with no confirmed exceptions is a one-line entry -- pure federal
// baseline. Do not add empty `{ overrides: {} }` objects; omit `overrides`
// entirely so it's obvious at a glance which states have a real, cited
// exception and which don't.
export const JURISDICTIONS: Record<string, StateJurisdiction> = {
  lagos: { code: "lagos" },
  ogun: { code: "ogun" },
  oyo: { code: "oyo" },
  osun: { code: "osun" },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tax/jurisdictions.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tax/jurisdictions.ts src/lib/tax/jurisdictions.test.ts
git commit -m "feat: add state jurisdiction registry"
```

---

### Task 2: State tax orchestrator

**Files:**
- Create: `src/lib/tax/state-tax.ts`
- Test: `src/lib/tax/state-tax.test.ts`

**Interfaces:**
- Consumes: `calculateNigeriaTax`, `TaxBreakdown` from `src/lib/tax-calculator.ts`; `JURISDICTIONS`, `StateJurisdiction` from `src/lib/tax/jurisdictions.ts` (Task 1); `NigeriaDeclarationForm`, `defaultNigeriaForm` from `src/types/declaration.ts`.
- Produces: `StateTaxBreakdown` interface and `calculateStateTax(form: NigeriaDeclarationForm, stateCode: string, jurisdictions?: Record<string, StateJurisdiction>): StateTaxBreakdown`, both exported for Tasks 8–11 to consume. The optional third parameter defaults to the real `JURISDICTIONS` registry in production; tests inject a fixture registry so the override-application logic can be proven without waiting on real state numbers.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/tax/state-tax.test.ts
import { describe, it, expect } from "vitest";
import { calculateStateTax } from "./state-tax";
import { calculateNigeriaTax } from "@/lib/tax-calculator";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";
import type { StateJurisdiction } from "./jurisdictions";

function form(overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm {
  return { ...defaultNigeriaForm, ...overrides };
}

describe("calculateStateTax", () => {
  it.each(["lagos", "ogun", "oyo", "osun"])(
    "falls through to the federal baseline for %s (no confirmed exceptions yet)",
    (stateCode) => {
      const input = form({ annualSalary: "900000" });
      const federal = calculateNigeriaTax(input);

      const result = calculateStateTax(input, stateCode);

      expect(result).toEqual({ ...federal, stateLevies: [] });
    }
  );

  it("falls through to the federal baseline for an unrecognized state code", () => {
    const input = form({ annualSalary: "900000" });
    const federal = calculateNigeriaTax(input);

    const result = calculateStateTax(input, "not-a-real-state");

    expect(result).toEqual({ ...federal, stateLevies: [] });
  });

  it("falls through to the federal baseline when no state is selected (e.g. a declaration created before this feature existed)", () => {
    const input = form({ annualSalary: "900000" });
    const federal = calculateNigeriaTax(input);

    const result = calculateStateTax(input, "");

    expect(result).toEqual({ ...federal, stateLevies: [] });
  });

  it("sums multiple state levies and rounds the final tax to kobo precision", () => {
    const testJurisdictions: Record<string, StateJurisdiction> = {
      "test-state": {
        code: "test-state",
        overrides: {
          levies: () => [
            { label: "Development Levy", amount: 1000.555 },
            { label: "Infrastructure Levy", amount: 500.111 },
          ],
        },
      },
    };

    const result = calculateStateTax(form({ annualSalary: "900000" }), "test-state", testJurisdictions);

    // federal finalTax for this input is 45200 (tax-calculator.test.ts's worked example)
    // 45200 + 1000.555 + 500.111 = 46700.666 -> rounds to 46700.67
    expect(result.finalTax).toBe(46700.67);
    expect(result.stateLevies).toEqual([
      { label: "Development Levy", amount: 1000.555 },
      { label: "Infrastructure Levy", amount: 500.111 },
    ]);
  });

  it("applies a finalTaxOverride in place of the federal final tax, with levies added on top", () => {
    const testJurisdictions: Record<string, StateJurisdiction> = {
      "test-state": {
        code: "test-state",
        overrides: {
          finalTaxOverride: () => 50000,
          levies: () => [{ label: "Flat Levy", amount: 1000 }],
        },
      },
    };

    const result = calculateStateTax(form({ annualSalary: "900000" }), "test-state", testJurisdictions);

    expect(result.finalTax).toBe(51000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tax/state-tax.test.ts`
Expected: FAIL — `Failed to resolve import "./state-tax"`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/tax/state-tax.ts
import { calculateNigeriaTax, type TaxBreakdown } from "@/lib/tax-calculator";
import type { NigeriaDeclarationForm } from "@/types/declaration";
import { JURISDICTIONS, type StateJurisdiction } from "./jurisdictions";

export interface StateTaxBreakdown extends TaxBreakdown {
  stateLevies: { label: string; amount: number }[];
}

/** Rounds to 2 decimal places (kobo precision), same convention as
 * tax-calculator.ts's own round2 -- duplicated here as a 2-line generic
 * math utility, not tax logic, so it isn't the kind of drift-risk
 * duplication the spec's Approach B rejection was about. */
function roundToKobo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateStateTax(
  form: NigeriaDeclarationForm,
  stateCode: string,
  jurisdictions: Record<string, StateJurisdiction> = JURISDICTIONS
): StateTaxBreakdown {
  const federal = calculateNigeriaTax(form);
  const jurisdiction = jurisdictions[stateCode];

  if (!jurisdiction?.overrides) {
    return { ...federal, stateLevies: [] };
  }

  const baseFinalTax = jurisdiction.overrides.finalTaxOverride
    ? jurisdiction.overrides.finalTaxOverride(federal, form)
    : federal.finalTax;

  const stateLevies = jurisdiction.overrides.levies?.(federal, form) ?? [];
  const leviesTotal = stateLevies.reduce((sum, levy) => sum + levy.amount, 0);

  return {
    ...federal,
    finalTax: roundToKobo(baseFinalTax + leviesTotal),
    stateLevies,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tax/state-tax.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tax/state-tax.ts src/lib/tax/state-tax.test.ts
git commit -m "feat: add state-aware tax orchestrator"
```

---

### Task 3: State list and lookup in the declaration types

**Files:**
- Modify: `src/types/declaration.ts`
- Test: `src/types/declaration.test.ts` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `NigeriaDeclarationForm.state: string` (added field), `StateOption` interface, `nigerianStates: StateOption[]`, `stateName(code?: string): string` — all exported for Tasks 4–11 to consume.

- [ ] **Step 1: Write the failing test**

```ts
// src/types/declaration.test.ts
import { describe, it, expect } from "vitest";
import { nigerianStates, stateName, defaultNigeriaForm } from "./declaration";

describe("nigerianStates", () => {
  it("has exactly 37 entries with unique codes (36 states + FCT)", () => {
    expect(nigerianStates).toHaveLength(37);
    const codes = nigerianStates.map((s) => s.code);
    expect(new Set(codes).size).toBe(37);
  });

  it("activates exactly the four Phase 1 launch states", () => {
    const activeCodes = nigerianStates.filter((s) => s.active).map((s) => s.code).sort();
    expect(activeCodes).toEqual(["lagos", "ogun", "osun", "oyo"]);
  });
});

describe("stateName", () => {
  it("looks up a state's display name by code", () => {
    expect(stateName("lagos")).toBe("Lagos");
  });

  it("returns a placeholder for an unrecognized or missing code", () => {
    expect(stateName("not-a-real-state")).toBe("—");
    expect(stateName(undefined)).toBe("—");
  });
});

describe("defaultNigeriaForm", () => {
  it("defaults state to an empty string", () => {
    expect(defaultNigeriaForm.state).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/types/declaration.test.ts`
Expected: FAIL — `nigerianStates is not exported` / `stateName is not a function` / `defaultNigeriaForm.state` is `undefined`

- [ ] **Step 3: Write minimal implementation**

Add `state: string;` to the `NigeriaDeclarationForm` interface (after `country: string;`), and `state: "",` to `defaultNigeriaForm` (after `country: "ng",`). Then append at the end of `src/types/declaration.ts`:

```ts
export interface StateOption {
  code: string;
  name: string;
  active: boolean;
}

// Phase 1 launches with Lagos/Ogun/Oyo/Osun active; the remaining 32
// states + FCT are listed inactive so activating one later is a data-only
// change (flip `active: true`), same mechanism as africanCountries above.
export const nigerianStates: StateOption[] = [
  { code: "lagos", name: "Lagos", active: true },
  { code: "ogun", name: "Ogun", active: true },
  { code: "oyo", name: "Oyo", active: true },
  { code: "osun", name: "Osun", active: true },
  { code: "abia", name: "Abia", active: false },
  { code: "adamawa", name: "Adamawa", active: false },
  { code: "akwa-ibom", name: "Akwa Ibom", active: false },
  { code: "anambra", name: "Anambra", active: false },
  { code: "bauchi", name: "Bauchi", active: false },
  { code: "bayelsa", name: "Bayelsa", active: false },
  { code: "benue", name: "Benue", active: false },
  { code: "borno", name: "Borno", active: false },
  { code: "cross-river", name: "Cross River", active: false },
  { code: "delta", name: "Delta", active: false },
  { code: "ebonyi", name: "Ebonyi", active: false },
  { code: "edo", name: "Edo", active: false },
  { code: "ekiti", name: "Ekiti", active: false },
  { code: "enugu", name: "Enugu", active: false },
  { code: "fct", name: "Federal Capital Territory (Abuja)", active: false },
  { code: "gombe", name: "Gombe", active: false },
  { code: "imo", name: "Imo", active: false },
  { code: "jigawa", name: "Jigawa", active: false },
  { code: "kaduna", name: "Kaduna", active: false },
  { code: "kano", name: "Kano", active: false },
  { code: "katsina", name: "Katsina", active: false },
  { code: "kebbi", name: "Kebbi", active: false },
  { code: "kogi", name: "Kogi", active: false },
  { code: "kwara", name: "Kwara", active: false },
  { code: "nasarawa", name: "Nasarawa", active: false },
  { code: "niger", name: "Niger", active: false },
  { code: "ondo", name: "Ondo", active: false },
  { code: "plateau", name: "Plateau", active: false },
  { code: "rivers", name: "Rivers", active: false },
  { code: "sokoto", name: "Sokoto", active: false },
  { code: "taraba", name: "Taraba", active: false },
  { code: "yobe", name: "Yobe", active: false },
  { code: "zamfara", name: "Zamfara", active: false },
];

export function stateName(code?: string): string {
  return nigerianStates.find((s) => s.code === code)?.name ?? "—";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/types/declaration.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/types/declaration.ts src/types/declaration.test.ts
git commit -m "feat: add Nigerian state list and lookup to declaration types"
```

---

### Task 4: Persist `state` — local storage, Supabase migration, API mapping

**Files:**
- Modify: `src/lib/local-db.ts`
- Modify: `src/lib/api.ts`
- Test: `src/lib/api.test.ts`
- Create: `supabase/migrations/20260924020000_declaration_state.sql`

**Interfaces:**
- Consumes: nothing new (uses `LocalDeclaration` from `local-db.ts`, already imported in `api.ts`).
- Produces: `LocalDeclaration.state?: string` (added field, optional — declarations created before this feature existed have none), `DeclarationRow.state: string | null`, both read by Task 8 (`NewDeclaration.tsx`) and Task 11 (`filing-summary.ts`).

**Note:** `state` is not added to the Dexie index string in `local-db.ts`'s `stores()` calls — nothing queries declarations `.where("state")`, and Dexie does not require a schema version bump to add a non-indexed field to a stored object's shape (confirmed by existing fields like `formData`, `amount`, `syncedAt`, none of which are indexed either). Do not add a `this.version(9)` block for this change.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/api.test.ts`, inside the existing `describe("fetchDeclarationsFromServer", ...)` block (after its existing `it(...)`):

```ts
    it("maps a present state, and leaves it undefined when absent (e.g. a declaration created before this feature existed)", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "decl-1", tax_year: "2025", country: "ng", type: "Income Tax", status: "submitted",
              form_data: {}, documents: [], amount: null, state: "lagos",
              created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-02T00:00:00.000Z",
            },
            {
              id: "decl-2", tax_year: "2024", country: "ng", type: "Income Tax", status: "approved",
              form_data: {}, documents: [], amount: null, state: null,
              created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-02T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchDeclarationsFromServer } = await import("./api");
      const declarations = await fetchDeclarationsFromServer();

      expect(declarations[0].state).toBe("lagos");
      expect(declarations[1].state).toBeUndefined();
    });
```

And inside the existing `describe("pushDeclarationsToServer", ...)` block (after its existing `it(...)`):

```ts
    it("includes state in the upserted row when present", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pushDeclarationsToServer } = await import("./api");
      await pushDeclarationsToServer([
        {
          id: "decl-1",
          taxYear: "2025",
          country: "ng",
          type: "Income Tax",
          status: "submitted",
          formData: {},
          documents: [],
          state: "lagos",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          pendingSync: 1,
        },
      ]);

      expect(builder.upsert).toHaveBeenCalledWith([
        expect.objectContaining({ id: "decl-1", state: "lagos" }),
      ]);
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — the new `fetchDeclarationsFromServer` case fails with `declarations[0].state` being `undefined` (not `"lagos"`) since the row mapping doesn't read it yet; the new `pushDeclarationsToServer` case fails because the upserted row has no `state` property.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/local-db.ts`, add to `LocalDeclaration` (after `country: string;`):

```ts
  /** State of residence for this filing (Nigerian states only today, e.g.
   * "lagos") -- a per-filing fact, not a profile attribute, since state of
   * residence as of Jan 1 determines which SIRS a filer files with and can
   * change between tax years. Absent on declarations created before this
   * field existed, or when country !== "ng"; calculateStateTax() and
   * stateName() both treat a missing/unrecognized value as "no state
   * selected" rather than an error. */
  state?: string;
```

Create `supabase/migrations/20260924020000_declaration_state.sql`:

```sql
-- Adds the tax-filing jurisdiction (Nigerian state of residence) to each
-- declaration. Nullable and unbackfilled -- declarations created before
-- this feature existed simply have no state, and calculateStateTax()
-- treats that the same as an unrecognized code: fall through to the
-- federal PIT baseline, never error.
alter table public.declarations add column state text;
```

In `src/lib/api.ts`, change:

```ts
interface DeclarationRow {
  id: string;
  tax_year: string;
  country: string;
  type: string;
```

to:

```ts
interface DeclarationRow {
  id: string;
  tax_year: string;
  country: string;
  state: string | null;
  type: string;
```

Change:

```ts
function rowToDeclaration(row: DeclarationRow): LocalDeclaration {
  return {
    id: row.id,
    taxYear: row.tax_year,
    country: row.country,
    type: row.type,
```

to:

```ts
function rowToDeclaration(row: DeclarationRow): LocalDeclaration {
  return {
    id: row.id,
    taxYear: row.tax_year,
    country: row.country,
    state: row.state ?? undefined,
    type: row.type,
```

Change:

```ts
  const rows = declarations.map((d) => ({
    id: d.id,
    user_id: userId,
    tax_year: d.taxYear,
    country: d.country,
    type: d.type,
```

to:

```ts
  const rows = declarations.map((d) => ({
    id: d.id,
    user_id: userId,
    tax_year: d.taxYear,
    country: d.country,
    state: d.state ?? null,
    type: d.type,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 5: Run the full suite to confirm no regressions**

Run: `npm run test`
Expected: all test files pass (existing `local-db.test.ts` and `account-deletion.test.ts` fixtures don't set `state`, which is fine since it's optional).

- [ ] **Step 6: Commit**

```bash
git add src/lib/local-db.ts src/lib/api.ts src/lib/api.test.ts supabase/migrations/20260924020000_declaration_state.sql
git commit -m "feat: persist declaration state locally and on the server"
```

---

### Task 5: Require a state for Nigeria declarations

**Files:**
- Modify: `src/lib/validation.ts`
- Test: `src/lib/validation.test.ts` (new)

**Interfaces:**
- Consumes: `NigeriaDeclarationForm`, `defaultNigeriaForm` from `src/types/declaration.ts` (Task 3).
- Produces: nothing new — `validateStep`'s existing signature is unchanged, only step 0's rules gain one more check.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateStep } from "./validation";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";

function form(overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm {
  return { ...defaultNigeriaForm, ...overrides };
}

describe("validateStep — step 0 (Country)", () => {
  it("requires a state when the country is Nigeria", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ng", state: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("State is required");
  });

  it("passes when tax year, country, and state are all provided", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ng", state: "lagos" }));

    expect(result.valid).toBe(true);
  });

  it("does not require a state for a non-Nigeria country", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ke", state: "" }));

    expect(result.valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: FAIL — the first test's `result.errors` does not contain `"State is required"` (rule doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/validation.ts`, change:

```ts
    case 0: // Country
      if (!form.taxYear) errors.push("Tax Year is required");
      if (!form.country) errors.push("Country is required");
      break;
```

to:

```ts
    case 0: // Country
      if (!form.taxYear) errors.push("Tax Year is required");
      if (!form.country) errors.push("Country is required");
      if (form.country === "ng" && !form.state) errors.push("State is required");
      break;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/validation.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/validation.test.ts
git commit -m "feat: require a state selection for Nigeria declarations"
```

---

### Task 6: State picker in the wizard's Country step

**Files:**
- Modify: `src/components/declaration/CountryStep.tsx`

**Interfaces:**
- Consumes: `nigerianStates` from `src/types/declaration.ts` (Task 3); `form.state`/`form.country` (Task 3); existing `update` callback prop (unchanged signature: `(key: string, value: string) => void`).
- Produces: nothing new for other tasks — this is a leaf UI change.

No automated test: there is no existing precedent for wizard-step component tests in this codebase (checked — no `CountryStep.test.tsx`, `ReviewStep.test.tsx`, etc. exist for any declaration step today), and the underlying logic this UI drives (which states are active, whether state is required) is already covered by Tasks 3 and 5. Verified instead via the type-check in `npm run build` (Step 2 below). This gap is called out in Review Focus item 3.

- [ ] **Step 1: Implement the state picker**

In `src/components/declaration/CountryStep.tsx`:

Change the import line:

```ts
import { Lock } from "lucide-react";
```

to:

```ts
import { Lock, MapPin } from "lucide-react";
```

Change:

```ts
import { africanCountries, type NigeriaDeclarationForm } from "@/types/declaration";
```

to:

```ts
import { africanCountries, nigerianStates, type NigeriaDeclarationForm } from "@/types/declaration";
```

Add, alongside the existing `handleCountrySelect`:

```ts
  const handleStateSelect = (code: string) => {
    update("state", code);
  };
```

Add, alongside the existing `hasCountryError`:

```ts
  const hasStateError = errors.some((e) => e.toLowerCase().includes("state"));
```

Add, immediately after the existing country `<div className="space-y-3">...</div>` block (i.e. after its closing `{hasCountryError && ...}` line and its wrapping `</div>`), still inside the outer `<div className="space-y-5">`:

```tsx
      {form.country === "ng" && (
        <div className="space-y-3">
          <Label className={cn("text-sm font-semibold", hasStateError && "text-destructive")}>Select State *</Label>
          <div className="grid grid-cols-2 gap-2">
            {nigerianStates.map((state) => (
              <button
                key={state.code}
                disabled={!state.active}
                onClick={() => state.active && handleStateSelect(state.code)}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  state.active && form.state === state.code
                    ? "border-primary bg-primary/5 shadow-card"
                    : state.active
                    ? "border-border bg-card hover:border-primary/40"
                    : "border-border/50 bg-muted/50 opacity-60 cursor-not-allowed"
                )}
              >
                <MapPin className={cn("w-5 h-5 shrink-0", state.active ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", !state.active && "text-muted-foreground")}>
                    {state.name}
                  </p>
                  {!state.active && (
                    <span className="text-[10px] text-muted-foreground font-medium">Coming soon</span>
                  )}
                </div>
                {!state.active && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                {state.active && form.state === state.code && (
                  <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {hasStateError && <p className="text-[10px] text-destructive font-medium">Please select a state</p>}
        </div>
      )}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/declaration/CountryStep.tsx
git commit -m "feat: add state picker to the declaration wizard's Country step"
```

---

### Task 7: Compute tax by state and persist it on submission

**Files:**
- Modify: `src/pages/NewDeclaration.tsx`

**Interfaces:**
- Consumes: `calculateStateTax` from `src/lib/tax/state-tax.ts` (Task 2); `state?: string` on the object passed to `db.declarations.add` (Task 4).
- Produces: nothing new for other tasks.

No automated test: no existing precedent for page-component tests in this codebase for the declaration wizard (confirmed in the prior activity-audit-trail PR, where the equivalent `NewDeclaration.tsx` wiring for `recordActivity` was also left untested at the page level, with the underlying logic tested at the lib layer instead — same pattern here: `calculateStateTax` itself is fully tested in Task 2). Verified via `npm run build`.

- [ ] **Step 1: Wire the state-aware calculation and persistence**

In `src/pages/NewDeclaration.tsx`, change:

```ts
import { calculateNigeriaTax, formatNaira } from "@/lib/tax-calculator";
```

to:

```ts
import { formatNaira } from "@/lib/tax-calculator";
import { calculateStateTax } from "@/lib/tax/state-tax";
```

In `handleSubmit`, change:

```ts
    const tax = calculateNigeriaTax(form);

    await db.declarations.add({
      id: declarationId,
      taxYear: form.taxYear || "2025",
      country: form.country || "ng",
      type: "Income Tax",
```

to:

```ts
    const tax = calculateStateTax(form, form.state);

    await db.declarations.add({
      id: declarationId,
      taxYear: form.taxYear || "2025",
      country: form.country || "ng",
      state: form.state,
      type: "Income Tax",
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/NewDeclaration.tsx
git commit -m "feat: compute tax by state and persist it on submission"
```

---

### Task 8: Show the selected state and state-aware total on the Review step

**Files:**
- Modify: `src/components/declaration/ReviewStep.tsx`

**Interfaces:**
- Consumes: `calculateStateTax` from `src/lib/tax/state-tax.ts` (Task 2); `stateName` from `src/types/declaration.ts` (Task 3).
- Produces: nothing new for other tasks.

No automated test, for the same reason as Tasks 6–7 (no existing wizard-step component test precedent; the logic it calls — `calculateStateTax`, `stateName` — is already tested). Verified via `npm run build`.

- [ ] **Step 1: Wire the state-aware calculation and display**

In `src/components/declaration/ReviewStep.tsx`, change:

```ts
import type { NigeriaDeclarationForm } from "@/types/declaration";
import type { UploadedDoc } from "./DocumentsStep";
import { calculateNigeriaTax } from "@/lib/tax-calculator";
```

to:

```ts
import { stateName, type NigeriaDeclarationForm } from "@/types/declaration";
import type { UploadedDoc } from "./DocumentsStep";
import { calculateStateTax } from "@/lib/tax/state-tax";
```

Change:

```ts
  const tax = calculateNigeriaTax(form);
```

to:

```ts
  const tax = calculateStateTax(form, form.state);
```

Change:

```tsx
        <Section title="General">
          <SummaryRow label="Tax Year" value={form.taxYear} />
          <SummaryRow label="Country" value="Nigeria 🇳🇬" />
        </Section>
```

to:

```tsx
        <Section title="General">
          <SummaryRow label="Tax Year" value={form.taxYear} />
          <SummaryRow label="Country" value="Nigeria 🇳🇬" />
          <SummaryRow label="State" value={stateName(form.state)} />
        </Section>
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/declaration/ReviewStep.tsx
git commit -m "feat: show the selected state and state-aware total on Review"
```

---

### Task 9: Show the filed state on the submission detail page

**Files:**
- Modify: `src/pages/SubmissionDetail.tsx`

**Interfaces:**
- Consumes: `stateName` from `src/types/declaration.ts` (Task 3); `declaration.state` (Task 4).
- Produces: nothing new for other tasks.

No automated test, same reasoning as Tasks 6–8. Verified via `npm run build`.

- [ ] **Step 1: Display the filed state**

In `src/pages/SubmissionDetail.tsx`, add to the imports:

```ts
import { stateName } from "@/types/declaration";
```

Change:

```tsx
          <DetailRow icon={MapPin} label="Country" value={declaration.country.toUpperCase()} />
          <DetailRow icon={DollarSign} label="Amount" value={declaration.amount || "—"} />
```

to:

```tsx
          <DetailRow icon={MapPin} label="Country" value={declaration.country.toUpperCase()} />
          <DetailRow icon={MapPin} label="State" value={stateName(declaration.state)} />
          <DetailRow icon={DollarSign} label="Amount" value={declaration.amount || "—"} />
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SubmissionDetail.tsx
git commit -m "feat: show the filed state on the submission detail page"
```

---

### Task 10: Include state in the filing summary and its PDF export

**Files:**
- Modify: `src/lib/filing-summary.ts`
- Modify: `src/lib/filing-summary-pdf.ts`
- Test: `src/lib/filing-summary.test.ts`
- Test: `src/lib/filing-summary-pdf.test.ts`

**Interfaces:**
- Consumes: `calculateStateTax`, `StateTaxBreakdown` from `src/lib/tax/state-tax.ts` (Task 2); `stateName` from `src/types/declaration.ts` (Task 3); `declaration.state` (Task 4).
- Produces: `FilingSummary.declaration.state?: string` and `FilingSummary.tax: StateTaxBreakdown` (widened from `TaxBreakdown`), consumed by `filing-summary-pdf.ts` in this same task.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/filing-summary.test.ts`, inside the `describe("buildFilingSummary", ...)` block:

```ts
  it("includes the declaration's filed state in the summary", () => {
    const summary = buildFilingSummary(declaration({ state: "lagos" }), profile());

    expect(summary.declaration.state).toBe("lagos");
  });

  it("computes tax via the state-aware engine, exposing a stateLevies breakdown", () => {
    const summary = buildFilingSummary(declaration({ state: "lagos" }), profile());

    expect(summary.tax.stateLevies).toEqual([]);
  });

  it("falls through cleanly for a declaration with no state selected (e.g. created before this feature existed)", () => {
    const summary = buildFilingSummary(declaration(), profile());

    expect(summary.declaration.state).toBeUndefined();
    expect(summary.tax.finalTax).toBe(45200);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/filing-summary.test.ts`
Expected: FAIL — `summary.declaration.state` is `undefined` in the first new test (not read from the declaration yet); `summary.tax.stateLevies` is `undefined` in the second (still using `calculateNigeriaTax`, which has no `stateLevies`).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/filing-summary.ts`, change:

```ts
import { calculateNigeriaTax, type TaxBreakdown } from "./tax-calculator";
import type { LocalDeclaration, LocalProfile } from "./local-db";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface FilingSummary {
  generatedAt: string;
  taxpayer: {
    name: string;
    taxId: string;
    country: string;
  };
  declaration: {
    taxYear: string;
    type: string;
    status: LocalDeclaration["status"];
  };
  tax: TaxBreakdown;
```

to:

```ts
import { calculateStateTax, type StateTaxBreakdown } from "./tax/state-tax";
import type { LocalDeclaration, LocalProfile } from "./local-db";
import type { NigeriaDeclarationForm } from "@/types/declaration";

export interface FilingSummary {
  generatedAt: string;
  taxpayer: {
    name: string;
    taxId: string;
    country: string;
  };
  declaration: {
    taxYear: string;
    type: string;
    status: LocalDeclaration["status"];
    state?: string;
  };
  tax: StateTaxBreakdown;
```

Change:

```ts
export function buildFilingSummary(declaration: LocalDeclaration, profile: LocalProfile): FilingSummary {
  const tax = calculateNigeriaTax(declaration.formData as unknown as NigeriaDeclarationForm);

  return {
    generatedAt: new Date().toISOString(),
    taxpayer: {
      name: profile.name,
      taxId: profile.taxId,
      country: profile.country,
    },
    declaration: {
      taxYear: declaration.taxYear,
      type: declaration.type,
      status: declaration.status,
    },
    tax,
    guidance: GUIDANCE,
  };
}
```

to:

```ts
export function buildFilingSummary(declaration: LocalDeclaration, profile: LocalProfile): FilingSummary {
  const tax = calculateStateTax(
    declaration.formData as unknown as NigeriaDeclarationForm,
    declaration.state ?? ""
  );

  return {
    generatedAt: new Date().toISOString(),
    taxpayer: {
      name: profile.name,
      taxId: profile.taxId,
      country: profile.country,
    },
    declaration: {
      taxYear: declaration.taxYear,
      type: declaration.type,
      status: declaration.status,
      state: declaration.state,
    },
    tax,
    guidance: GUIDANCE,
  };
}
```

In `src/lib/filing-summary-pdf.ts`, add to the imports:

```ts
import { stateName } from "@/types/declaration";
```

Change:

```ts
  heading("Declaration");
  y += 2;
  row("Tax Year", summary.declaration.taxYear);
  row("Type", summary.declaration.type);
  row("Status", summary.declaration.status);
  y += 4;
  rule();
```

to:

```ts
  heading("Declaration");
  y += 2;
  row("Tax Year", summary.declaration.taxYear);
  row("State", stateName(summary.declaration.state));
  row("Type", summary.declaration.type);
  row("Status", summary.declaration.status);
  y += 4;
  rule();
```

In `src/lib/filing-summary-pdf.test.ts`, update the fixture's `declaration` object so the new row has real data to render:

```ts
    declaration: { taxYear: "2025", type: "Income Tax", status: "submitted", state: "lagos" },
```

(replacing the existing `declaration: { taxYear: "2025", type: "Income Tax", status: "submitted" },` line), and add `stateLevies: []` to the fixture's `tax` object (after `effectiveRate: 5.02,`) so it matches the widened `StateTaxBreakdown` type.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/filing-summary.test.ts src/lib/filing-summary-pdf.test.ts`
Expected: PASS (8 + 2 tests)

- [ ] **Step 5: Run the full suite and build to confirm no regressions**

Run: `npm run test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/filing-summary.ts src/lib/filing-summary-pdf.ts src/lib/filing-summary.test.ts src/lib/filing-summary-pdf.test.ts
git commit -m "feat: include filed state in the filing summary and PDF export"
```

---

## Final verification (after all tasks)

- [ ] Run: `npm run test` — expect all test files passing, with 5 new/modified test files across this plan (`jurisdictions.test.ts`, `state-tax.test.ts`, `declaration.test.ts`, `validation.test.ts`, plus the extended `api.test.ts` and `filing-summary.test.ts`/`filing-summary-pdf.test.ts`) and zero regressions in the untouched suite.
- [ ] Run: `npm run build` — expect success.
- [ ] Run: `npm run lint` — expect the pre-existing baseline (17 errors / 9 warnings as of the `activity-audit-trail` PR) with no new errors introduced by this plan's files.
- [ ] Manual smoke check (not automated — flagged per Review Focus item 3): start the dev server, walk through creating a new declaration, confirm the state grid shows Lagos/Ogun/Oyo/Osun as selectable and the other 33 entries locked with "Coming soon," confirm selecting a state and submitting carries through to the Review step's total, the Submissions list, the Submission Detail page, and the exported PDF.
