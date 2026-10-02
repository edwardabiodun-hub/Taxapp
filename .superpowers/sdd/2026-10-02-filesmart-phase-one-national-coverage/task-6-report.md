# Task 6 Report — Reviewable receipt OCR workflow

## Status

Implemented and committed as `feat: add reviewable receipt OCR workflow`.

## Implementation

- Added receipt domain contracts, field-level confidence/provenance, supported currencies/categories, safe file limits, and confirmed-only calculation inputs.
- Added the managed OCR provider boundary with runtime endpoint/key configuration, response validation, provider/model/version metadata, and contract-gated retention/no-training copy.
- Added OCR service workflow for capture, consent, processing, review, manual fallback, confirmation, rejection, and correction provenance.
- Added scanner/review UI with image preview, explicit consent, editable fields, confidence indicators, and confirm/reject actions.
- Integrated receipt scanning into `DocumentsStep` and `NewDeclaration`; only confirmed receipt IDs and structured inputs are attached to preparations.
- Extended local receipt persistence validation for captured/processing/reviewed records while preserving opaque asset references and excluding raw bytes.

## Checks and results

- Focused Vitest command was attempted and stopped before test discovery by the documented environment issue:
  `Cannot read directory "../../../../..": Access is denied` and unresolved `vitest.config.ts`.
- Isolated TypeScript check reached project compilation but reported three existing preparation-repository typing errors in `src/lib/preparation-repository.ts` and `src/lib/__tests__/preparation-repository.test.ts`; no Task 6 source/type errors remained.
- Lint was started but interrupted per request before completion.
- `git diff --check` was not run after the final request to stop checks.

## Concerns

- The OCR provider remains optional and unconfigured by default; the UI falls back to manual entry when configuration is absent or the provider fails.
- The existing SWC/esbuild/DACL environment issue prevents the focused Vitest runner from discovering tests in this worktree.
- Provider retention and no-training language is emitted only when explicit runtime contract metadata is present.
