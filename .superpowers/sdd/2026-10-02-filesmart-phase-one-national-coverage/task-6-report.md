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

## Security Review Fix Round 4

### Status

Implemented and committed as `fix: harden legacy receipt persistence`.

### Findings addressed

- Legacy receipt records now apply the shared safe receipt-text guard to required metadata and optional `errorMessage`/`confirmedAt` values, including payload/secret-like and oversized-value rejection.
- Legacy `extractedData` strings and numeric values are bounded and validated before persistence; data URLs, blob URLs, base64/raw payload markers, secret/key-like strings, and oversized values are rejected.
- Optional legacy metadata is validated through the existing strict provenance, field, correction-history, and calculation-input schemas, so unknown nested keys cannot be persisted. Partial modern records are no longer treated as legacy records.
- Existing new-record OCR safeguards remain enforced, including confirmed-only calculation inputs and nested schema validation.

### Verification

- Focused no-SWC Vitest command: `npx vitest run --config .task6-legacy-vitest.config.ts`
- Result: PASS — 1 test file, 37 tests.
- Standard focused command was also attempted and remained blocked before discovery by the existing esbuild/worktree access error. No long test suite or environment repair was run.
- The temporary focused configuration was removed after verification.
- `git diff --check` was run after the fix and passed.

## Final Confirmation-Boundary Fix

### Status

Implemented as `fix: enforce receipt confirmation boundary`.

### Finding addressed

- `saveReceiptRecord` now rejects confirmed records and any attached `calculationInput` on the public persistence path.
- Confirmed records are persisted only through the module-private writer used by `confirmReceipt`; confirmation construction and calculation-input attachment remain inside that operation.
- Added a repository regression test covering both crafted confirmed writes and calculation-input attachment to a review record.

### Verification limitations

- The focused Vitest command remained blocked before test discovery by the existing esbuild/worktree access error.
- A quick application TypeScript check was stopped after reporting existing preparation-repository/OCR fixture errors and current receipt-boundary typing errors; no further checks or environment repair were run per request.
