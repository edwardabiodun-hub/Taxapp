# Task 4 Implementation Report

## Status

DONE_WITH_CONCERNS

Task 4 now uses the registry-backed 37-jurisdiction selector, exposes truthful
readiness/source copy, and keeps declaration preparation local-first. New saves
are drafts or explicit ready-for-review transitions; the unconditional
submitted write and filing language were removed.

The follow-up review fixes now persist supporting-document metadata in the
preparation form data without raw file bytes, render review tax values only
from the page's `calculatePreparation` result. A fresh ready-for-review action
now saves the preparation as `draft` before making the allowed
`draft`-to-`ready_for_review` transition; if that transition fails, the page
truthfully reports that the draft was saved and does not claim readiness.

## Checks

- Focused regression coverage added: serializable document metadata mapping,
  provenance-gated review output, and fresh ready-for-review persistence
  through the repository's draft-first lifecycle.
- Standard focused Vitest: blocked before test discovery by the documented
  esbuild worktree DACL error. A no-SWC config retry hit the same environment
  boundary; the temporary config was removed.
- TypeScript check: `npx tsc --noEmit --pretty false` passed.
- Build: blocked before config loading by the same esbuild worktree DACL error.
- Lint: blocked by 18 pre-existing repository errors outside this fix scope
  (plus baseline warnings); no new lint errors remain in the changed files.
- `git diff --check`: pass.

## Concerns

- The configured national PIT baseline remains unverified/unconfigured, so the
  UI conservatively shows `Not filing-ready` while allowing generic preparation.
- The existing CountryStep file is preserved for non-declaration use; the
  declaration flow no longer imports it.
- Runtime regression tests could not execute in this worktree because Vitest
  and Vite fail before discovery/config loading; test behavior is covered by
  the added focused cases and the passing TypeScript check, but not runtime-
  verified in this environment.
