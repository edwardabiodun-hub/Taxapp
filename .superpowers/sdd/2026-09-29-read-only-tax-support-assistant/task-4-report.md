# Task 4 report — client API and responsive support chat

## Status and commit

Task 4 implemented and committed as `b6657eb` (`feat: add responsive read-only support chat`). Only the seven scoped client/UI files were committed. Pre-existing untracked audit artifacts were untouched.

## Changed files

- `src/lib/support-chat.ts` — narrow authenticated Edge Function call, strict message/history validation, response projection, HTTPS citation filtering, and user-safe `SupportChatError` states.
- `src/lib/support-chat.test.ts` — client contract, rejection, error, and response-projection tests.
- `src/components/support/SupportChat.tsx` — ephemeral chat state, responsive Sheet/Drawer, safe answer display, suggested prompts, loading, error, escalation, keyboard, and focus behavior.
- `src/components/support/SupportChatMessage.tsx` — plain-text messages and accessible citation links.
- `src/components/support/SupportChat.test.tsx` — launcher/dialog, disclaimer, prompts, submit/loading, citations, account label, private-field exclusion, offline/provider errors, mobile/desktop, and Escape/focus tests.
- `src/components/layout/AppLayout.tsx` — mounts the chat once and owns open state.
- `src/components/layout/TopBar.tsx` — adds the 44px accessible support launcher beside notifications; Messages navigation remains separate.

## Tests and output

- RED: `npm test -- src/lib/support-chat.test.ts` failed because `./support-chat` did not exist. The first sandboxed attempt could not resolve the nested-worktree Vite config; the same command outside the sandbox showed the expected missing-module failure.
- GREEN: `npm test -- src/lib/support-chat.test.ts` — exit 0; 5 tests passed.
- RED: `npm test -- src/components/support/SupportChat.test.tsx` failed because `./SupportChat` did not exist.
- Final exact bounded command: `npm test -- src/lib/support-chat.test.ts src/components/support/SupportChat.test.tsx src/App.test.tsx` — exit 0; 3 files, 23 tests passed. React Router printed future-flag warnings only.
- Focused ESLint over all seven changed files — exit 0, no findings.
- `npx tsc --noEmit -p tsconfig.app.json` — exit 1 on existing diagnostics outside Task 4 (`App.test.tsx`, `DocumentsStep.tsx`, `SyncContext.test.tsx`, `account-deletion.test.ts`, `api.test.ts`, `auth-gateway.test.ts`, `auth.ts`, and `SubmissionDetail.tsx`). The one Task 4 `Object.hasOwn` compatibility diagnostic observed on the first run was fixed; the rerun contained no Task 4 diagnostics.
- `git diff --cached --check` — exit 0 before commit.

## Concerns

- No live Supabase/provider or deployed-browser test was run in Task 4. Task 5 owns deployment and adversarial verification.
- The project-wide TypeScript check is not green due to the unrelated pre-existing diagnostics listed above. No project-wide/UI suite was started, per the user's bounded-test direction.
- In-memory conversation history is intentionally lost on refresh and retained while the app layout remains mounted. No local document, draft, profile, or provider credential source is read by this client slice.

## Fix round — Task 4 review findings

Production changes are limited to the Task 4 support UI. A shared display filter now removes lines containing exact currency and amount-like values (including unprefixed `Income: ₦4,000,000`), direct identifiers, email, phone, raw profile fields, document-content indicators, and internal workflow terms from both user and assistant message display. General tax explanations, including a TIN definition and VAT percentage, remain visible. Account-context labeling now requires an explicit private account-status prompt; a public question about the status of Nigerian VAT reform does not receive the synced-records label. The desktop Sheet close control uses the Sheet content's supported descendant styling for a minimum 44px keyboard target, preserving the existing Escape behavior.

Regression coverage was added for those boundaries, 401/session-expired and 429/rate-limit UI states, 429 client error mapping, the desktop close target, and mounting through `AppLayout` while the Messages route remains available. Changed files: `src/components/support/SupportChat.tsx`, `SupportChatMessage.tsx`, `display-safety.ts`, `SupportChat.test.tsx`, and `src/lib/support-chat.test.ts`.

Verification:

- Exact bounded Task 4 command, `npm test -- src/lib/support-chat.test.ts src/components/support/SupportChat.test.tsx src/App.test.tsx`: 28 passed, 2 failed in `App.test.tsx` after its first test timed out at 5 seconds under parallel execution; the second failure was duplicate DOM left by that timeout. Both Task 4 test files passed.
- Same three files with `--no-file-parallelism`: exit 0; 3 files, 30 tests passed.
- Final focused `npm test -- src/components/support/SupportChat.test.tsx`: exit 0; 14 tests passed.
- Focused ESLint over Task 4 client/UI files: exit 0, no findings.
- `npx tsc --noEmit -p tsconfig.app.json`: exit 1 on diagnostics in `App.test.tsx`, `DocumentsStep.tsx`, `SyncContext.test.tsx`, `account-deletion.test.ts`, `api.test.ts`, `auth-gateway.test.ts`, `auth.ts`, and `SubmissionDetail.tsx`; no Task 4 file diagnostic. These diagnostics predate this fix round and remain outside its scope.

## Fix round 2 — role-aware display safety

The display filter now requires an explicit `user` or `assistant` role. User-entered messages remove amount-like values and identifiers. Assistant messages remove direct personal financial statements, including `Your tax liability for 2025 is 4000000.` and `Your income is NGN 4,000,000.`, while retaining public statutory wording such as `The VAT registration threshold is NGN 25,000,000.` Shared PII, document-content, and internal-text filtering still applies to both roles. `SupportChat` and `SupportChatMessage` pass the role explicitly; the account-context label, desktop 44px close target, 401/429 states, and AppLayout/Messages navigation remain covered by the existing UI tests.

Changed files: `src/components/support/display-safety.ts`, new `display-safety.test.ts`, `SupportChat.tsx`, `SupportChatMessage.tsx`, and `SupportChat.test.tsx`. No unrelated source or pre-existing untracked artifact was changed.

Verification: `npm test -- src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism` — exit 0, 2 files and 19 tests passed. Focused ESLint on the five Task 4 files — exit 0, no findings. `npx tsc --noEmit -p tsconfig.app.json` still exits 1 on the same diagnostics outside Task 4 (`App.test.tsx`, `DocumentsStep.tsx`, `SyncContext.test.tsx`, `account-deletion.test.ts`, `api.test.ts`, `auth-gateway.test.ts`, `auth.ts`, and `SubmissionDetail.tsx`); it reports no Task 4 diagnostic.

## Fix round 3 — tax-bill and unformatted salary privacy cases

The role-aware display patterns now suppress assistant text `Your tax bill is NGN 4,000,000.` and user text `My salary 4000000`. Direct regression cases also retain suppression of `Your tax liability for 2025 is 4000000.` and visibility of the public statement `The VAT registration threshold is NGN 25,000,000.` The UI test exercises both new privacy cases in a rendered conversation. Existing account-label, 44px close, 401/429, and AppLayout/Messages coverage remains in the focused UI suite.

Changed files: `src/components/support/display-safety.ts`, `display-safety.test.ts`, and `SupportChat.test.tsx`. Verification: `npm test -- src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism` — exit 0, 2 files and 23 tests passed. Focused ESLint on those three files — exit 0, no findings. TypeScript was not rerun in this round; the prior app check reported only diagnostics outside Task 4.
