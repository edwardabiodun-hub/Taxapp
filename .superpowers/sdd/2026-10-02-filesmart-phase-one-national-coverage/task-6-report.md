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

## Security Review Fix Round 2

### Status

Implemented and committed as `fix: tighten receipt schema validation`.

### Findings addressed

- Nested receipt field objects, calculation inputs, provenance, trusted contract metadata, original OCR fields, and correction-history entries now require the exact supported key sets. Unknown nested properties are rejected before persistence and before confirmed receipt data is considered for calculation.
- `NewDeclaration` now performs receipt listing and calculation-input preparation inside the guarded save path. Storage failures set a truthful error message and `finally` always clears `isSaving`.
- Added domain, repository, and declaration regression coverage for nested unknown-property rejection and receipt-storage save failures.

### Verification limitations

- The focused Vitest command was attempted after adding the regressions but was blocked before test discovery by the existing esbuild/worktree access error while resolving `vitest.config.ts`.
- A quick application TypeScript check was also attempted; it reported existing unrelated preparation-repository and OCR asset typing errors. No long test suite, build, lint, or environment repair was run per request.
- `git diff --check` passed before the final report-only update, with only normal LF-to-CRLF working-copy warnings.

## Security Review Fix Round 3

### Status

Implemented with verification constrained by the existing test-runner environment failure.

### Findings addressed

- Optional OCR contract metadata is now accepted when omitted. When present, provenance and contract objects still require only their explicitly supported keys; missing contract metadata does not authorize retention or no-training claims.
- Receipt correction-history `previousValue` and `correctedValue` now use the same safe scalar and field-semantic validation as receipt values, including payload/secret-like string rejection, size limits, and currency/category/date/amount validation. Correction entries still require the exact supported schema.
- Added regressions for contract-less managed OCR responses and unsafe/invalid correction-history values.

### Verification limitations

- Focused Vitest command:
  `npm run test -- src/domain/__tests__/receipts.test.ts src/lib/__tests__/managed-ocr-provider.test.ts`
- Result: blocked before test discovery by the existing esbuild/worktree access error: `Cannot read directory "../../../../..": Access is denied` and unresolved `vitest.config.ts`.
- No long test suite or environment repair was run. Temporary configs were not created in this fix round.
