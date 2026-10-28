# Pre-Review Calculation Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Capture unresolved tax-treatment facts, fail closed for ambiguous deductions, and make generic exports explicit about their provenance and non-submission status without changing approved 2026 tax rates or deduction formulas.

**Architecture:** Extend the existing declaration form with optional review facts. The shared calculator validates those facts before applying the existing NTA 2025/2026 baseline. The same fields flow through declaration review and the existing universal export allowlist; no new tax-rule engine, migration, or provider is introduced.

**Tech Stack:** React, TypeScript, Vitest, existing Dexie/export services, Tailwind utility classes.

**Spec:** `docs/superpowers/specs/2026-10-16-nta-2025-pit-calculation-design.md` and the tax-professional review pack at `C:/Users/eddie/Tax Project/outputs/tax-professional-review/tax-professional-review-pack-2026-10-27.md`.

## Global Constraints

- Keep the calculation profile limited to tax year 2026 until a later approved profile exists.
- Do not change tax bands, deduction rates, relief caps, deadlines, penalties, or legal wording in this batch.
- Preserve savable preparations even when numeric estimation is withheld.
- Do not claim direct filing, authority acceptance, or professional approval.
- Do not add secrets, production migrations, deployment changes, or new dependencies.

## Review Focus

- A rent period crossing the assessment year must not be silently treated as annual qualifying rent.
- Shared-tenancy rent must not be silently treated as wholly attributable to one taxpayer.
- Life-insurance premiums without the applicable paid year must not be deducted silently.
- Mortgage interest without principal-residence confirmation must not be deducted silently.
- Exported review facts must remain available without leaking unsafe or unallowlisted fields.

### Task 1: Add review facts and calculator validation

**Files:**
- Modify: `src/types/declaration.ts`
- Modify: `src/lib/tax-calculator.ts`
- Test: `src/lib/tax-calculator.test.ts`

- [x] Add optional fields for rent period dates, shared tenancy, insurance paid year, mortgage principal-residence status, and employment-period context.
- [x] Add failing tests for each ambiguous case and for a valid, fully documented case preserving the existing numeric result.
- [x] Implement validation that raises `TaxEstimateUnavailableError` with human-readable reasons; do not alter the existing formula after validation succeeds.

### Task 2: Capture and review the facts in the UI

**Files:**
- Modify: `src/pages/TaxCalculator.tsx`
- Modify: `src/components/declaration/DeductionsStep.tsx`
- Modify: `src/components/declaration/ReviewStep.tsx`

- [x] Add accessible date/select controls with explicit “not confirmed” options.
- [x] Explain that unresolved facts can be saved but prevent a numeric estimate.
- [x] Show the captured facts in the review summary.

### Task 3: Preserve provenance in universal exports

**Files:**
- Modify: `src/lib/exports/export-data.ts`
- Test: `src/lib/__tests__/export-service.test.ts`

- [x] Add the optional review facts to the explicit export allowlist.
- [x] Add summary rows for estimate scope and manual-submission limitations.
- [x] Verify export tests retain unsafe-field omission and include the new review facts.

### Task 4: Documentation and quality gates

**Files:**
- Modify: `docs/superpowers/implementation-record.md`

- [x] Record the implementation and its limits as `READY_FOR_REVIEW`.
- [x] Run focused tests, the full test suite, typecheck, lint, and production build.
- [x] Do not commit, push, migrate, or deploy.
