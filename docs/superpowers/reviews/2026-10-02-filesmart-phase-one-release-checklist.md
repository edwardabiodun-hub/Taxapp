# FileSmart Phase One Security Release Checklist

## Context

This is a bounded evidence gate for the local-first Phase One release. It records verification status and rollback steps; it does not authorize production deployment, direct filing, or authority acceptance.

## Security and migration checks

| Check | Command | Expected result | Evidence / status |
| --- | --- | --- | --- |
| Focused security boundaries | `npm run test -- src/lib/__tests__/security-boundaries.test.ts` | PASS; executable extensions, unsupported MIME, oversized receipts, unconfirmed receipt inputs, preparation scoping, safe errors, authority references, and legacy migration all remain blocked or conservative | Run result recorded below |
| Existing boundary coverage | `npm run test -- src/lib/__tests__/ocr-service.test.ts src/lib/__tests__/receipt-repository.test.ts src/lib/__tests__/preparation-repository.test.ts src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/submission-service.test.ts` | PASS; focused repository, OCR, migration, and submission contracts remain green | Run result recorded below |
| Static checks | `npm run lint` | PASS with no new lint errors | Run result recorded below |
| Production build | `npm run build` | PASS; no compile or bundling errors | Run result recorded below |
| Secret/artifact review | `git diff --check`; `git status --short` | No whitespace errors, secrets, real PII, receipt bytes, generated exports, or OCR artifacts in the change | Run result recorded below |

## Evidence record

- Date: 2026-10-02
- Branch/worktree: `codex/filesmart-phase-one` / `filesmart-phase-one`
- Focused test result: `NOT RUN` — the configured Windows esbuild/SWC native-cache/DACL environment blocks the test runner before discovery.
- Existing boundary result: `NOT RUN` — same test-runner blocker; static review and test definitions are present.
- Lint result: `NOT RUN` — must be rerun in a working environment before release approval.
- Build result: `NOT RUN` — must be rerun in a working environment before release approval.
- Artifact review: `PASS` — diff review found no secrets, real PII, receipt bytes, or generated user artifacts; `.gitignore` unchanged.

## Migration rehearsal expectations

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
