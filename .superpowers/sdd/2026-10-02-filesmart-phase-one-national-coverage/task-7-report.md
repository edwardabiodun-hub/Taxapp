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
- `downloadExportArtifact` now defers temporary anchor removal and object-URL revocation until a one-shot timer after a successful click, while the `finally` path cleans up immediately when click or timer scheduling fails.
- `NewDeclaration` locks the rendered preparation form after export and removes the Back/navigation controls, so the displayed package cannot silently diverge from editable state. Regeneration is not offered; a new preparation is required for changed data.
- Export persistence now reconstructs a sanitized preparation from the explicit safe-field allowlist, sanitized document/provenance metadata, and empty receipt-input payloads. It never spreads arbitrary caller `formData` or raw bytes/secrets into persisted preparation records.
- Added regression coverage for deferred/immediate download cleanup, exported-state form/navigation locking, and persistence exclusion of unknown fields, secrets, and raw bytes.

## Verification

- `npx tsc --noEmit --pretty false`: PASS (exit 0).
- Targeted ESLint on changed source/tests: PASS with 0 errors and 1 existing `react-refresh/only-export-components` warning for the exported download helper in `ExportPanel.tsx`.
- `git diff --check`: PASS.
- Focused Vitest command (`npm test -- --run src/lib/__tests__/export-service.test.ts src/components/exports/__tests__/ExportPanel.test.tsx src/pages/__tests__/NewDeclaration.test.tsx`): BLOCKED before test discovery by the environment DACL error: `Cannot read directory "../../../../..": Access is denied`, followed by failure to resolve the Vitest config.
- `npx tsc --noEmit --pretty false`: PASS (exit 0).
- Targeted ESLint on changed source/tests: PASS with 0 errors and 1 existing `react-refresh/only-export-components` warning for the exported download helper in `ExportPanel.tsx`.
- `git diff --check`: PASS.
- A temporary no-SWC Vitest config produced the same pre-discovery DACL failure and was removed. No long/full test run was performed.

## Source and worktree state

- Task 7 source history before this follow-up: `5ee6be8` (`feat: add universal tax export packages`), `972ee5b` (`fix: harden universal export packages`), and `c194621` (`fix: complete universal export workflow`).
- `c194621` already contains the unrelated `.superpowers/sdd/.gitignore` addition and Task 2 report update; those are committed history, not current unstaged changes.
- Before this follow-up, the worktree had no unrelated tracked changes. The only local ignored content is the existing SDD artifact set and `node_modules`.
- No temporary test/config files were added by this follow-up. The follow-up will be finalized with subject `fix: lock exported preparation integrity`; the resulting commit hash is returned with this report.
