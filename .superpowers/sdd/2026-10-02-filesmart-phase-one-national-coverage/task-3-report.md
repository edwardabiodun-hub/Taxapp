# Task 3 Implementation Report

## Status

DONE_WITH_CONCERNS

Task 3 source changes and the remaining re-review fixes are complete. Sync
acknowledgement now compares the full prepared snapshot, new persistence starts
only at `draft`, legacy migration applies explicit transition checks without
downgrading local records, and receipt records reject inline/raw asset data.
The post-fix focused test rerun was intentionally stopped at the user's
request; prior bounded runs remain limited by the documented environment
issues below.

## Commit hash

`3461b56147aceabca3dcdbd27d69880e833f320a`.

## Files changed

- `src/lib/local-db.ts`
- `src/lib/preparation-repository.ts`
- `src/lib/deadline-repository.ts`
- `src/lib/receipt-repository.ts`
- `src/lib/export-repository.ts`
- `src/lib/mock-api.ts`
- `src/hooks/use-local-data.ts`
- `src/lib/sync-service.ts`
- `src/lib/__tests__/local-db-migration.test.ts`
- `src/lib/__tests__/preparation-repository.test.ts`
- `src/lib/__tests__/receipt-repository.test.ts`

Pre-existing workspace changes were preserved and not staged: the modified
Task 2 report and the untracked `.superpowers/sdd/.gitignore`.

## Exact commands and results

### Task brief and setup

Read:

```text
.superpowers/sdd/2026-10-02-filesmart-phase-one-national-coverage/task-3-brief.md
```

The provided `task-start` helper was attempted but could not execute under
PowerShell because the extensionless Bash script returned `Access is denied`.
The brief and current HEAD were read directly instead.

### Required focused Vitest command

```text
npm run test -- src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/preparation-repository.test.ts
```

Sandbox result: FAIL before test discovery. Esbuild could not read the
worktree config and reported:

```text
Cannot read directory "../../../../..": Access is denied.
Could not resolve ...\\filesmart-phase-one\\vitest.config.ts
```

Elevated result: FAIL before test execution because the SWC native binding is
missing:

```text
Error: Failed to load native binding
Cannot find module './swc.win32-x64-msvc.node'
code: ERR_SWC_NATIVE_CACHE
```

### Bounded no-SWC focused run

```text
npx vitest run --config .task3-vitest.config.ts src/lib/__tests__/local-db-migration.test.ts src/lib/__tests__/preparation-repository.test.ts
```

Result: 3 migration tests passed. The 4 repository tests failed before their
repository assertions because the jsdom environment has no IndexedDB:

```text
TypeError: Cannot read properties of undefined (reading 'deleteDatabase')
```

The temporary no-SWC configuration was removed afterward. No environment
repair or dependency installation was attempted.

### Isolated Task 3 typecheck

```text
npx tsc -p .task3-tsconfig.json --noEmit
```

Result: PASS. The temporary Task 3 config was removed afterward.

### Full application typecheck

```text
npx tsc -p tsconfig.app.json --noEmit
```

Result: FAIL on three pre-existing errors in
`src/pages/NewDeclaration.tsx:59`: `UploadedDoc` has no `name`, `size`, or
`type` property. No Task 3 source error was reported.

### Build

```text
npm run build
```

Sandbox result: FAIL before compilation with the same esbuild access-denied
config-resolution error.

Elevated result: FAIL before compilation with the missing SWC native binding
and `ERR_SWC_NATIVE_CACHE`.

### Lint

```text
npm run lint
```

Result: FAIL with the existing baseline of 18 errors and 8 warnings across
the application. The reported errors include existing `no-explicit-any`,
empty-interface, conditional-hook, and `require()` findings. No new lint
category was introduced by the Task 3 behavior.

### Diff hygiene

```text
git diff --check
```

Result: PASS. Git emitted only normal LF-to-CRLF working-copy warnings.

## Decisions

- Bumped Dexie from schema version 3 to 4 and added `preparations`,
  `jurisdictionCapabilities`, `deadlines`, `receiptRecords`,
  `exportPackages`, and `submissionEvents`. The legacy `declarations` store
  remains intact for one migration cycle; no local data is deleted.
- Stored preparations carry private `pendingSync`/`syncedAt` metadata while
  repository reads return only `PreparationRecord` values. `updatedAt` never
  regresses on an update, and `createdAt` remains stable.
- Migrated Nigerian legacy records use the country context `NG` without
  guessing a state. Legacy `submitted`, `processing`, `audit_request`, and
  `approved` statuses become `ready_for_review` unless an explicit authority
  reference is present. Only that explicit reference permits
  `authority_confirmed`.
- Enforced monotonic preparation status transitions; a new preparation or a
  draft cannot transition directly to `authority_confirmed`.
- Submission events are append-only and authority-confirmed events require a
  non-empty authority reference.
- Receipt records store an asset reference and metadata only; raw receipt
  bytes are not indexed or persisted in the receipt table contract.
- Added deadline, receipt, export, and preparation repository boundaries.
- Added repository-backed `usePreparations` and `usePreparation` hooks. The
  legacy `useDeclarations` hook remains on the legacy table during the
  planned migration cycle.
- Preparation sync is separate from authority status. Failed preparation
  synchronization leaves local records and authority status unchanged; legacy
  server declarations are migrated conservatively, and an existing
  authority-confirmed preparation is never downgraded by a legacy pull.
- Sync acknowledgement uses a full stable serialization of the prepared
  snapshot, so an equal-timestamp local edit remains pending.
- New records can only start as `draft`; legacy migration may materialize
  `ready_for_review` only through the explicit draft-to-ready path and skips
  authority-confirmed records without a valid local lifecycle path.
- Receipt `assetRef` values are limited to opaque references; `data:`, `blob:`,
  base64, and byte payloads are rejected.

## Concerns

- Runtime repository tests remain unverified because this worktree has no
  IndexedDB implementation for jsdom. Adding or repairing test-environment
  dependencies was outside the requested bounded verification scope.
- The newly added regression cases were not rerun after implementation because
  the user requested immediate finalization and no long-running checks.
- Standard Vitest and build remain blocked by the pre-existing SWC native
  package/cache issue. No extended environment repair was attempted.
- Full application typecheck and lint remain blocked by unrelated baseline
  findings listed above.
- The preparation sync endpoint is represented by the existing mock API and
  must be replaced by a real backend adapter in a later integration task.
- Legacy UI consumers still read the legacy declarations table until the
  later flow/dashboard tasks migrate them to preparation repositories.
