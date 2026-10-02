# Task 2 Implementation Report

## Status

DONE_WITH_CONCERNS

Task 2 implementation is committed. Runtime Vitest verification remains blocked by the repository's SWC native-cache failure. A temporary no-SWC focused run executed the tests, but its numeric assertion was corrected afterward and was not rerun because execution was stopped at the user's request.

## Commit hash(es)

- `d9f796b` — `feat: add tax calculation provenance`

## Files changed

- Created `src/data/pit-baseline.ts`
- Created `src/lib/calculation-service.ts`
- Created `src/lib/__tests__/calculation-service.test.ts`
- Modified `src/lib/tax-calculator.ts`
- Modified `src/domain/preparations.ts`

Temporary `.task2-tsconfig.json` and `.task2-vitest.config.ts` files were used for isolated verification and removed before commit.

## Exact commands and results

### Required focused Vitest command

Command:

```text
npm run test -- src/lib/__tests__/calculation-service.test.ts
```

Result: FAIL before test execution in the sandbox. Vite/esbuild could not read the worktree config:

```text
Cannot read directory "../../../../..": Access is denied.
Could not resolve "...\\filesmart-phase-one\\vitest.config.ts"
```

Elevated retry result: FAIL before test execution because the SWC native binding is unavailable:

```text
Error: Failed to load native binding
Cannot find module './swc.win32-x64-msvc.node'
code: ERR_SWC_NATIVE_CACHE
```

### Isolated TypeScript check

Command:

```text
npx tsc -p .task2-tsconfig.json --noEmit
```

Result: PASS. The temporary config was removed after the check.

### Full application TypeScript check

Command:

```text
npx tsc -p tsconfig.app.json --noEmit
```

Result: FAIL on the pre-existing `src/pages/NewDeclaration.tsx:59` `UploadedDoc` property errors (`name`, `size`, and `type`). No Task 2 error was reported.

### Temporary no-SWC focused run

Command:

```text
npx vitest run --config .task2-vitest.config.ts
```

Sandbox result: the same esbuild access-denied config-resolution failure.

Elevated result before correcting the hand-calculated fixture: 3 tests passed and 1 failed because the test expected `52,900` while the existing calculator correctly returned `54,000` for a ₦1,000,000 salary. The expected value was corrected to `54,000`; the focused run was not repeated after that correction because the user requested that environment work stop.

### Diff hygiene

Command:

```text
git diff --check
```

Result: PASS. Git reported only normal LF-to-CRLF working-copy warnings for existing modified TypeScript files.

The exact required combined focused/existing-calculator test command and the application build were not rerun after the user-directed stop.

## Design decisions

- Added a versioned `PitBaseline` object containing the existing calculator bands, minimum-tax rate, assumptions, profile ID, version, effective tax years, source, and verification metadata.
- Left the approved official source and effective tax-year metadata empty because no approved official Nigerian PIT baseline source is present in the repository. `getPitBaseline()` throws `PitBaselineConfigurationError` rather than fabricating legal provenance.
- Kept numeric calculation available through the existing calculator and moved its rule inputs behind the baseline data module, preserving the prior formula and direct calculator API.
- Added `calculatePreparation()` to return numeric results plus calculation label, filing-readiness, rule profile, rule-profile version, source, assumptions, and missing-input warnings.
- Forced the calculation service to `Not filing-ready` when the baseline source is unavailable or required tax-year, jurisdiction, or income input is missing. State-specific labeling is never inferred from a generic capability.
- Added optional `calculationProvenance` fields to preparation records so existing Task 1 fixtures remain source-compatible while downstream preparation persistence can retain provenance.

## Concerns

- The approved official Nigerian PIT baseline source is still missing. The service therefore intentionally does not claim the calculation is filing-ready and returns empty source/version provenance with an explicit warning.
- The repository's normal Vitest/build path cannot start because of the SWC native-cache/binding issue (`ERR_SWC_NATIVE_CACHE`). No environment repair was attempted.
- The full application typecheck has unrelated pre-existing `UploadedDoc` errors in `NewDeclaration.tsx`.
- The corrected isolated focused test run was not repeated after the fixture correction due to the explicit stop request. Runtime behavior is therefore not fully reverified in this turn.

## Task 2 Fix Round

### Status

DONE_WITH_CONCERNS

All Critical and Important review findings were addressed in the source and regression tests. Runtime focused-test execution remains unverified because the repository's test startup is blocked by the worktree/esbuild access restriction; no SWC repair was attempted.

### Commit hash

- `3c9b610` — `fix: harden tax calculation provenance`

### Findings addressed

1. `createPreparationRecord` now delegates to `calculatePreparation`, so it inherits baseline/source/tax-year validation. `isPreparationCalculationReady` now rejects missing, warning-bearing, or incomplete provenance.
2. The registry generic profile is explicitly unconfigured: empty rule-profile version, empty source/effective/review metadata, and `status: "unconfigured"`. The calculation service returns an unconfigured generic profile rather than capability placeholder metadata when no baseline is applied.
3. Verified-state calculations now use the applied state profile's version and evidence source/effective period/verification/confidence rather than national-baseline metadata.
4. `CalculationProvenance` is required on persisted `PreparationRecord` values and includes effective tax years, effective period, verification timestamp, and confidence. Readiness requires those fields to be complete.
5. Configured baseline resolution now requires `input.taxYear` to be included in `effectiveTaxYears`; uncovered years return `Not filing-ready` with an explicit warning.
6. Baseline fallback catches only `PitBaselineConfigurationError`; unexpected errors propagate.

### Files changed

- Modified `src/data/jurisdiction-registry.ts`
- Modified `src/data/pit-baseline.ts`
- Modified `src/domain/jurisdictions.ts`
- Modified `src/domain/preparations.ts`
- Modified `src/lib/calculation-service.ts`
- Modified `src/domain/__tests__/jurisdictions.test.ts`
- Modified `src/domain/__tests__/preparations.test.ts`
- Modified `src/lib/__tests__/calculation-service.test.ts`

### Fix-round commands and exact results

Isolated typecheck:

```text
npx tsc -p .superpowers\\sdd\\2026-10-02-filesmart-phase-one-national-coverage\\task-2-fix-tsconfig.json --noEmit
```

Result: PASS. The temporary config was removed after the check.

Required focused tests:

```text
npm run test -- src/lib/__tests__/calculation-service.test.ts src/domain/__tests__/jurisdictions.test.ts src/domain/__tests__/preparations.test.ts
```

Result: UNVERIFIED/FAIL before test execution in the sandbox. Exact startup failure:

```text
Cannot read directory "../../../../..": Access is denied.
Could not resolve "...\\filesmart-phase-one\\vitest.config.ts"
```

No elevated retry or SWC repair was attempted after the stop request.

Temporary no-SWC focused command:

```text
npx vitest run --config .superpowers\\sdd\\2026-10-02-filesmart-phase-one-national-coverage\\task-2-fix-vitest.config.ts
```

Result: UNVERIFIED/FAIL before test execution with the same esbuild access-denied config-resolution failure. The temporary config was removed after the check.

Diff hygiene:

```text
git diff --check
```

Result: PASS, with only normal LF-to-CRLF working-copy warnings.

The application build and full test suite were not run in this fix round because the user directed that extended environment/test work stop.

## Task 2 Fix Round 2

### Status

DONE_WITH_CONCERNS

The two scoped re-review findings were fixed. The normal Vitest runtime remains blocked by the repository's missing SWC native binding, but the focused tests pass under a temporary no-SWC configuration. The existing fail-closed baseline/source/tax-year behavior and the absence of an invented Nigerian legal source were preserved.

### Findings addressed

1. `createPreparationRecord` now builds its calculation input through `getConfirmedCalculationInputs`, so confirmed receipt-derived values are merged only when represented by a confirmed receipt ID. A regression test proves a confirmed `annualSalary` input is not silently dropped into the calculation's missing-income validation.
2. `getPreparationCalculationLabel` now returns `State-specific estimate` only when the capability resolves to a verified state profile and persisted provenance is complete. A generic capability paired with complete persisted state provenance falls back to `Generic Nigerian PIT estimate`; incomplete provenance remains `Not filing-ready`.

### Files changed

- Modified `src/domain/preparations.ts`
- Modified `src/domain/__tests__/preparations.test.ts`

### Fix-round commands and exact results

Isolated typecheck:

```text
npx tsc -p .task2-fix-round2-tsconfig.json --noEmit
```

Result: PASS. The temporary config was removed after the check.

Required focused tests:

```text
npm run test -- src/lib/__tests__/calculation-service.test.ts src/domain/__tests__/jurisdictions.test.ts src/domain/__tests__/preparations.test.ts
```

Result: BLOCKED before test discovery by the existing worktree/esbuild access error in the sandbox. Elevated retry reached Vitest but failed before test execution because `@swc/core` could not load `swc.win32-x64-msvc.node` (`ERR_SWC_NATIVE_CACHE`).

Temporary no-SWC focused verification:

```text
npx vitest run --config .task2-fix-round2-vitest.config.ts
```

Result: PASS — 3 test files, 20 tests. The temporary configuration was removed after the check.

Diff hygiene:

```text
git diff --check
```

Result: PASS.

### Remaining concern

The standard Vitest/SWC runtime still requires environment repair or dependency reinstallation outside this scoped fix. The passing no-SWC run verifies the scoped domain and calculation behavior, but does not remove that runtime limitation.

## Task 2 Fix Round 3

### Status

DONE_WITH_CONCERNS

The remaining scoped issue was fixed: `getPreparationCalculationLabel` now returns `Not filing-ready` before evaluating persisted provenance whenever `preparation.jurisdictionCode` is empty or whitespace. The regression test covers both `""` and `"   "` with a verified-state capability and complete persisted state provenance. Prior fixes for confirmed receipt inputs and state-specific evidence validation were preserved.

### Files changed

- Modified `src/domain/preparations.ts`
- Modified `src/domain/__tests__/preparations.test.ts`

### Verification

Isolated typecheck:

```text
npx tsc -p .task2-round3-tsconfig.json --noEmit
```

Result: PASS. The temporary typecheck configuration was removed after verification.

Standard focused tests:

```text
npm run test -- src/lib/__tests__/calculation-service.test.ts src/domain/__tests__/jurisdictions.test.ts src/domain/__tests__/preparations.test.ts
```

Result: BLOCKED before test execution by the existing `@swc/core` native binding failure (`ERR_SWC_NATIVE_CACHE`; missing `swc.win32-x64-msvc.node`). No environment repair was attempted.

Focused no-SWC tests:

```text
npx vitest run --config .task2-round3-vitest.config.ts
```

Result: PASS — 3 test files, 21 tests. The temporary no-SWC configuration was removed after verification.

The required final status is therefore `DONE_WITH_CONCERNS` because standard Vitest remains blocked, despite the isolated typecheck and no-SWC focused tests passing.
