# FileSmart Phase One Security Release Checklist

## Context

This is a bounded evidence gate for the local-first Phase One release. It records verification status and rollback steps; it does not authorize production deployment, direct filing, or authority acceptance.

## Security and migration checks

| Check | Command | Expected result | Evidence / status |
| --- | --- | --- | --- |
| Focused security boundaries | `npm run test -- src/lib/__tests__/security-boundaries.test.ts` | PASS; executable extensions, unsupported MIME, oversized receipts, unconfirmed receipt inputs, preparation scoping, safe errors, authority references, and legacy migration all remain blocked or conservative | Run result recorded below |
| Existing boundary coverage | `npm run test -- src/lib/__tests__/ocr-service.test.ts src/lib/__tests__/receipt-repository.test.ts src/lib/__tests__/preparation-repository.test.ts src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/submission-service.test.ts` | PASS; focused repository, OCR, migration, and submission contracts remain green | Run result recorded below |
| TypeScript project check | `npx tsc -b --noEmit --pretty false` | PASS; no type errors | Run result recorded below |
| Static checks | `npm run lint` | PASS with no new lint errors | Run result recorded below |
| Production build | `npm run build` | PASS; no compile or bundling errors | Run result recorded below |
| Secret/artifact review | `git diff --check`; `git status --short` | No whitespace errors, secrets, real PII, receipt bytes, generated exports, or OCR artifacts in the change | Run result recorded below |

## Evidence record

- Date: 2026-10-02
- Branch/worktree: `codex/filesmart-phase-one` / `filesmart-phase-one`
- Focused test result: `PASS` — the complete Vitest run passed 27 suites and 179 tests using a mapped-drive verification copy to work around the nested Windows ACL/path issue.
- Existing boundary result: `PASS` — the complete run includes the security-boundary, OCR, receipt, migration, repository, and submission-service suites.
- TypeScript result: `PASS` — `npx tsc -b --noEmit --pretty false` completed successfully.
- Static checks: `PASS` — `npm run lint` exits with 0 errors; 10 existing Fast Refresh warnings remain.
- Build result: `PASS` — `npm run build` completed successfully through the mapped-drive workaround; Vite reports only the existing stale Browserslist data and large-chunk warnings.
- Artifact review: `PASS` — `git diff --check` is clean and the final worktree contains no verification copies, secrets, real PII, receipt bytes, or generated user artifacts; `.gitignore` unchanged.

The default nested-path Vitest/Vite invocations remain affected by the host's Windows esbuild parent-directory ACL behavior. The mapped-drive commands above exercise the same source and dependencies and completed successfully.

## Migration rehearsal expectations

### Follow-up: build warning remediation

- Updated only `caniuse-lite` in the npm lockfile, from `1.0.30001727` to `1.0.30001814`. The standalone database updater selected the repository's Bun lockfile, so the update used `npm update caniuse-lite --ignore-scripts --no-audit --no-fund` instead.
- Pages now load through React lazy imports. A route boundary presents an accessible loading state and a safe error with an explicit reload action; application navigation remains outside the page boundary.
- Main application chunk: 846.28 kB to 461.11 kB minified; 261.85 kB to 148.97 kB gzip. These figures describe the main chunk, not the total bytes needed by every route.
- `npm run build`: PASS, with neither stale Browserslist nor oversized-chunk warnings. No warning threshold changes or manual chunk rules were needed.
- `npm test`: PASS, 28 suites / 181 tests, including loading and failed-import navigation recovery.
- TypeScript: PASS. ESLint: PASS, 0 errors / 10 existing Fast Refresh warnings.
- Standard build and test commands worked in the original worktree with elevated filesystem access; no mapped-drive or copied-source workaround was needed for this follow-up.

### Expected migration behavior

- A legacy Nigeria `draft` remains `draft`.
- A legacy `submitted` label without trusted local authority state becomes `ready_for_review`, never `authority_confirmed`.
- Missing documents remain an empty document list and do not block reading the preparation.
- `pendingSync` remains true until the local preparation is safely acknowledged; sync state is not authority confirmation.
- Legacy authority-like fields do not independently promote a record; an authority confirmation requires an explicit reference and timestamp through the submission service.

## Rollback

1. Disable the Phase One OCR, export, or submission-adapter feature flag that introduced the issue.
2. Keep local preparations, receipt metadata/assets, submission evidence, and export metadata intact for later recovery.
3. Route users to manual receipt entry and universal review exports while the issue is investigated.
4. Do not delete preparations, receipts, exports, migration inputs, or local database records as a rollback action.
5. Re-run the focused security and migration checks before re-enabling a flag.

## Known environment blockers

- No direct filing or portal-ready adapter is authorized by this checklist.
- A multi-owner/server deployment still requires an explicit authenticated owner-scope test; Phase One only verifies preparation-scoped local reads.
- Any legal rule, state-specific deadline, provider contract, or authority workflow without current evidence remains conservative and blocks promotion.
