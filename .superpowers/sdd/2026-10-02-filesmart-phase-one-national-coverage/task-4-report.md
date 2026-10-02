# Task 4 Implementation Report

## Status

DONE_WITH_CONCERNS

Task 4 now uses the registry-backed 37-jurisdiction selector, exposes truthful
readiness/source copy, and keeps declaration preparation local-first. New saves
are drafts or explicit ready-for-review transitions; the unconditional
submitted write and filing language were removed.

## Checks

- Focused no-SWC Vitest: 2 files, 3 tests passed.
- Standard focused Vitest: blocked before discovery by the documented esbuild
  worktree DACL error; no temporary config remains.
- TypeScript check: blocked by pre-existing Task 3 `PreparationRecord` errors
  in `src/lib/__tests__/preparation-repository.test.ts` and
  `src/lib/preparation-repository.ts`.
- `git diff --check`: pass.

## Concerns

- The configured national PIT baseline remains unverified/unconfigured, so the
  UI conservatively shows `Not filing-ready` while allowing generic preparation.
- The existing CountryStep file is preserved for non-declaration use; the
  declaration flow no longer imports it.
