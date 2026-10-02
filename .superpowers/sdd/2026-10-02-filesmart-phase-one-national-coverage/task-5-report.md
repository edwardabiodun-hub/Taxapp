# Task 5 — Source-aware deadline tracker

## Status

DONE_WITH_CONCERNS

Implemented the local-first deadline resolver, boundary-driven countdown hook, accessible deadline card, and Dashboard/NewDeclaration integrations. Resolver precedence is verified state → verified national baseline → explicit unverified fallback. Malformed or expired source metadata is never presented as verified.

## Files changed

- `src/domain/deadlines.ts`
- `src/domain/jurisdictions.ts`
- `src/data/jurisdiction-registry.ts`
- `src/lib/deadline-service.ts`
- `src/hooks/use-deadline-countdown.ts`
- `src/components/deadlines/DeadlineCard.tsx`
- `src/lib/__tests__/deadline-service.test.ts`
- `src/components/deadlines/__tests__/DeadlineCard.test.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/NewDeclaration.tsx`

## Checks

- `git diff --check` — PASS.
- Targeted ESLint for Task 5 source/tests — PASS.
- `npx tsc -p tsconfig.app.json --noEmit` — BLOCKED by pre-existing Task 3 type errors in `src/lib/__tests__/preparation-repository.test.ts` (lines 319, 321) and `src/lib/preparation-repository.ts` (line 257); no Task 5 diagnostics were reported.
- Focused Vitest command — BLOCKED before test discovery by the existing Vite/SWC/DACL startup failure: `Cannot read directory "../../../../..": Access is denied`, followed by Vitest config resolution failure. A temporary no-SWC config was also blocked by the same environment error and was removed.

## Concerns

The bundled registry intentionally has no configured Nigerian deadline source, so production cards currently render the explicit unverified state until evidence is added. No Nigerian deadline, legal source, or filing claim was invented. Runtime test execution remains unverified in this worktree because of the environment startup failure.

## Review Fix Round

### Findings addressed

- `deadline-service` now requires a valid, explicit, timezone-qualified `effectiveFrom` for both verified state and national evidence, and rejects evidence that is not yet effective at the resolution time.
- `use-deadline-countdown` now schedules safe minute-boundary updates for all future deadlines, keeping day/hour values current without polling or intervals; the existing effect cleanup remains in place.
- `DeadlineCard` now formats deadline and verification dates in the evidence timezone and falls back to UTC, including the displayed timezone label, when the source zone is invalid.

### Regression coverage

- Future and missing `effectiveFrom` evidence remains unverified.
- Countdown updates when an actual deadline-relative day boundary is crossed.
- Deadline and verification dates render in `America/Los_Angeles`, with invalid-zone fallback coverage.

### Review-round checks

- Targeted ESLint for changed source/tests — PASS.
- `npx tsc -p tsconfig.app.json --noEmit` — BLOCKED by the same pre-existing Task 3 errors in `src/lib/__tests__/preparation-repository.test.ts` (lines 319, 321) and `src/lib/preparation-repository.ts` (line 257); no Task 5 diagnostics were reported.
- Focused Vitest, including the review regression tests — BLOCKED before test discovery by the existing Vite/esbuild startup error: `Cannot read directory "../../../../..": Access is denied`.
- Temporary review Vitest configuration — removed after the blocked verification attempt.
- `git diff --check` — PASS.

Status remains `DONE_WITH_CONCERNS` because the source changes and regression tests are complete, but runtime test execution is blocked by the worktree environment.
