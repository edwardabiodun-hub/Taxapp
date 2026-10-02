# Task 8 Report — Explicit filing status and adapter boundaries

## Status

Implemented as a hardening follow-up to `08ed37e3d3ff3ccd1f70fa3a67826cc486dab655`; committed as `fix: harden filing status history`.

## Delivered

- Added `SubmissionAdapter` and a universal export/manual-handoff adapter. It generates the existing PDF/CSV/XLSX package, exposes a not-submitted checklist, and rejects direct filing/status claims.
- Added `SubmissionService` for export, explicit user-submission evidence, and authority confirmation. Lifecycle jumps, missing evidence, empty references, and confirmed-record replacement are rejected.
- Added immutable user-evidence support to submission events without mass-assigning submission metadata.
- Validated `submittedAt` as a real, non-future timestamp; missing timestamps are assigned by the service clock.
- Made preparation lifecycle changes and immutable submission-event appends atomic through Dexie transactions.
- Prevented authority-confirmed records from being re-exported and downgraded.
- Replaced the submissions list/detail UI with preparation lifecycle statuses: Draft, Ready for review, Exported, User submitted, and Authority confirmed.
- Added generic/manual authority handoff language, including pending authority confirmation for user-submitted records.
- Preserved and merged legacy declaration rows offline and after migration; retained legacy declaration documents and activity history alongside new submission events.

## Checks

- Focused Vitest invocation — blocked before test discovery by the environment’s esbuild/DACL error: `Cannot read directory "../../../../..": Access is denied` and failure to resolve the Vitest config.
- No further tests, typecheck, build, lint, or diff checks were run after the final hardening edits, per instruction.
- No temporary Task 8 config was present at finalization.

## Concerns

Runtime Vitest/build verification remains unavailable in this worktree because of the documented Windows esbuild/DACL issue. No direct state filing adapter or authority acceptance claim was introduced. The commit is limited to Task 8 status/history hardening and regression coverage.
