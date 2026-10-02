# Task 7 Report — Universal tax export packages

## Status

Task 7 is implemented, with the remaining review findings fixed in this follow-up. PDF, CSV, and XLSX artifacts remain review/manual-upload exports only: they do not file a return, submit to an authority, or confirm acceptance.

## Implementation and review fixes

- Added typed universal export package and metadata contracts.
- Added lazy `jspdf@2.5.2` and `xlsx@0.18.5` loading behind focused exporter modules.
- Added stable, escaped CSV sections and XLSX Summary, Income & Deductions, Assumptions, and Document Index sheets with visible `Not submitted` language.
- Added PDF summary/checklist with jurisdiction, authority limitation, tax year, readiness, provenance, source dates, missing items, documents, assumptions, and explicit non-submission language.
- Export document indexes contain preparation metadata and confirmed receipt references only; receipt originals/raw bytes, unconfirmed OCR, tax IDs, and token-like fields remain excluded.
- Optional persistence stores opaque artifact references and moves an eligible preparation to `exported`; it does not create `user_submitted` or `authority_confirmed` events.
- When a preparation is `exported`, `NewDeclaration` removes Save as draft and Mark ready for review actions, updates the status banner to `Exported — downloads ready`, and shows download/non-filing state instead of offering invalid `exported -> draft` or `exported -> ready_for_review` transitions.
- `downloadExportArtifact` now removes its temporary anchor and revokes its object URL in a `finally` block, including when `anchor.click()` throws.
- Added regression coverage for exported-state controls/status and successful or throwing download cleanup.

## Verification

- `npx tsc --noEmit --pretty false`: PASS (exit 0).
- Targeted ESLint on changed source/tests: PASS with 0 errors and 1 existing `react-refresh/only-export-components` warning for the exported download helper in `ExportPanel.tsx`.
- `git diff --check`: PASS.
- Focused Vitest command (`npm test -- --run src/pages/__tests__/NewDeclaration.test.tsx src/components/exports/__tests__/ExportPanel.test.tsx`): BLOCKED before test discovery by the environment DACL error: `Cannot read directory "../../../../..": Access is denied`, followed by failure to resolve the Vitest config.
- A temporary no-SWC Vitest config produced the same pre-discovery DACL failure and was removed. No long/full test run was performed.

## Source and worktree state

- Task 7 source history before this follow-up: `5ee6be8` (`feat: add universal tax export packages`), `972ee5b` (`fix: harden universal export packages`), and `c194621` (`fix: complete universal export workflow`).
- `c194621` already contains the unrelated `.superpowers/sdd/.gitignore` addition and Task 2 report update; those are committed history, not current unstaged changes.
- Before this follow-up, the worktree had no unrelated tracked changes. The only local ignored content is the existing SDD artifact set and `node_modules`.
- The follow-up was finalized with subject `fix: align export lifecycle UI`; the final amended commit hash is returned with this report.
