# Nigeria Tax Act 2025 PIT implementation plan

> **For Codex:** Execute this plan in the isolated `codex/app-reconcile-317c038` worktree. For each behavior, first add a failing behavioral test, observe failure, implement, then observe passing tests. Do not push or deploy.

**Goal:** Produce sourced 2026 PIT estimates under the Nigeria Tax Act 2025 without leaking obsolete arithmetic or numeric results for unsupported cases; preserve saved preparations.

**Architecture:** One year-scoped statutory rule profile and calculator. Unsupported inputs raise a typed estimation error. Preparation service and export surfaces convert that to a no-estimate state with explicit reasons. No state-level override without verified authority.

**Tech stack:** React, TypeScript, Vitest, Vite.

### Task 1: Statutory calculation core
- [x] Add failing tests for every band boundary, zero rate, rent relief, all statutory deductions, bonus treatment, and strict amount validation.
- [x] Replace legacy baseline with a sourced 2026 profile; remove CRA and minimum tax; implement strict amount parsing.
- [x] Run focused calculator tests.

### Task 2: Unsupported cases and year gate
- [x] Add failing tests for pre-2026/future years, ambiguous benefits/investments, contradictory net figures, and low-income employment exemption.
- [x] Implement typed fail-closed outcome and 2026-only calculator; wire preparation service to return `tax: null` and warnings while preserving draft metadata.
- [x] Run service and calculator tests.

### Task 3: Capture supported deduction facts and render safely
- [x] Add form and component tests for NHF, NHIS, mortgage interest, insurance/annuity premiums and unsupported-case messages.
- [x] Update declaration and standalone estimator inputs, year choices, review and copy. Only render tax when an estimate exists.
- [x] Run component tests and typecheck.

### Task 4: Historical and export safety
- [x] Add failing tests for old/unsupported declarations in filing summaries and PDFs, and for removal of legacy minimum-tax content.
- [x] Route summary/state wrapper through the same calculator; render no numeric amount where unsupported. Confirm CSV/XLSX do not independently recalculate old PIT.
- [x] Run export/summary tests.

### Task 5: Release verification
- [x] Run full test suite, TypeScript check, lint, build, and inspect final diff for legacy numeric paths.
- [ ] Obtain independent code review and fix P0/P1 issues found.
- [ ] Report remaining legal/tax-review release gate; do not claim professional approval or deploy.
