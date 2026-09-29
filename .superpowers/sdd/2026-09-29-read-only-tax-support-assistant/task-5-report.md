# Task 5 report — adversarial and deployment verification

## Status and commit

Task 5's scoped tests and documentation are implemented and committed as `98a3a683d3db815c3392f2c785536c6c03586232` (`test: verify support assistant privacy boundaries`). Automated verification is not fully green because one pre-existing UI test times out and repository-wide lint has existing errors. No deployment, production infrastructure, live browser, Supabase, Deno, or provider verification was performed.

## Changed files

- `src/support-chat-security.test.ts` — nine handler-boundary adversarial tests covering the five required forbidden prompts, refusal before knowledge/summary/provider calls, rejected body user/declaration selectors, caller bearer propagation to no-argument summary RPCs, caller-specific summaries, and exclusion of sensitive RPC fields from model context and HTTP output.
- `README.md` — documents Supabase-only configuration without values, including exact-hostname `LLM_ALLOWED_HOSTS`, the egress and DNS rebinding gate, service-role restrictions, and migration/function/frontend order.
- `docs/superpowers/plans/2026-09-29-read-only-tax-support-assistant-qa.md` — repeatable preview-browser checklist and evidence record.

`src/App.test.tsx` was not changed because `SupportChat.test.tsx` already covers launcher mounting through `AppLayout` and unchanged Messages navigation. `supabase/functions/deno.json` did not require a change. The pre-existing untracked `.gstack/`, `.npm-cache/`, `handoff.md`, and `reports/edge-origin-security-audit-2026-09-29.md` were untouched.

## Commands and actual output

- `npm test -- src/support-chat-security.test.ts --no-file-parallelism` — exit 0 outside the sandbox: `Test Files 1 passed (1); Tests 9 passed (9)`. The first sandboxed attempt exited 1 at Vitest config loading (`Cannot read directory "../../../../../..": Access is denied`); the same test command then ran successfully outside the sandbox.
- `npm test -- --no-file-parallelism` — exit 1 after completing in 150.63 seconds: `Test Files 1 failed | 59 passed (60); Tests 1 failed | 364 passed (365)`. The sole failure is `src/components/declaration/CountryStep.test.tsx > CountryStep > shows only Nigeria during the Nigeria-first launch phase`, timed out at 5,000 ms. Prior Task 1 and Task 2 reports recorded this same existing test timeout. The new nine tests and `src/App.test.tsx` passed in this run.
- `npm run lint` — exit 1: `24 problems (14 errors, 10 warnings)`. All reported paths are outside the three Task 5 files; errors include existing `no-explicit-any`, `no-empty-object-type`, and `no-require-imports` findings. The new test's focused `npx eslint src/support-chat-security.test.ts` exited 0 with no findings.
- `npm run build` — exit 0: Vite transformed 3,473 modules and reported `built in 20.00s`. It warned about 15-month-old Browserslist data and a chunk over 500 kB; neither warning failed the build.
- `git diff --cached --check` — exit 0 before commit. Only the three Task 5 files above were staged and committed.

## Concerns and remaining gates

- The full suite is not green due to the recurring `CountryStep` timeout. The repository-wide lint command is not green due to errors in unchanged files. No claim of a complete pass is made.
- Handler tests use injected clients and deterministic fixtures. Live Supabase/RLS cross-account behavior, Deno module resolution, the provider endpoint, ingress IP-header provenance, exact-hostname DNS behavior, and egress blocking still require an isolated deployment check.
- The browser QA checklist is a runbook only. Desktop/mobile presentation, live citations and statuses, provider/offline recovery, and bundle/network secret inspection remain unverified until a deployed preview is available.

## Final fix round — provider output privacy

Commit: `1e41f91` (`fix: redact support provider filenames and workflow details`). The report remains in the plan's git-ignored scratch directory.

The server sanitizer now drops output lines with document-style filenames or FileSmart operational/workflow descriptions. The client display filter applies the same patterns as defense in depth. Safe general tax guidance and official source URLs remain visible; the handler's approved citation data is unchanged. Handler-level tests inject filename, workflow, and PII text from the provider and assert the HTTP answer excludes it. The original refusal/no-provider assertions remain in place.

Fix files: `supabase/functions/support-chat/prompt.ts`, `supabase/functions/support-chat/policy.test.ts`, `src/support-chat-security.test.ts`, `src/components/support/display-safety.ts`, and `src/components/support/display-safety.test.ts`. README and QA documentation required no change in this round.

- RED, before the first production fix: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts --no-file-parallelism` — exit 1; 3 failed, 50 passed. The HTTP answer contained `salary-slip.pdf`, `payslip.jpg`, and the FileSmart compliance-queue description.
- GREEN for those initial cases: the same command — exit 0; 3 files, 53 tests passed.
- RED for an additional workflow paraphrase (`FileSmart forwards uploaded forms to staff.`): the same command — exit 1; 3 failed, 50 passed. This exposed a missing verb in both filters.
- Final bounded focused command: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism --testTimeout=10000` — exit 0; 5 files, 119 tests passed. React Router printed future-flag warnings only.
- Focused `npx eslint supabase/functions/support-chat/prompt.ts supabase/functions/support-chat/policy.test.ts src/support-chat-security.test.ts src/components/support/display-safety.ts src/components/support/display-safety.test.ts` — exit 0, no findings.

The prior full-suite `CountryStep` timeout and repository-wide lint errors remain as documented above. Neither the full suite nor live browser/Supabase/Deno/provider verification was rerun in this fix round.

## Final response-output fix round 2

Commit: `4642c641e83a88365ffa64d922dbb8fb7b3e40dc` (`fix: redact more support output filenames and private details`). The report remains in the plan's git-ignored scratch directory.

The server sanitizer and client display filter now recognize Unicode and leading-underscore document filenames, including `.odt`; they remove FileSmart storage/triage disclosures and explicit `Name:`/`Address:` lines. The provider-output handler test covers `__salary.pdf`, `résumé.pdf`, `tax-return.odt`, both supplied FileSmart operational sentences, and the two labeled PII lines. Focused sanitizer tests retain an official `.pdf` source URL and general Nigerian tax guidance. Existing refusal, DTO, rate, CORS, and UI tests remain in the focused suite.

Scoped files: `supabase/functions/support-chat/prompt.ts`, `supabase/functions/support-chat/policy.test.ts`, `src/support-chat-security.test.ts`, `src/components/support/display-safety.ts`, and `src/components/support/display-safety.test.ts`.

- RED: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts --no-file-parallelism` — exit 1; `Test Files 3 failed (3); Tests 3 failed | 50 passed (53)`. The HTTP response still contained the new filenames, storage/triage descriptions, and labeled PII; the client filter still displayed the new filenames and descriptions.
- GREEN: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism --testTimeout=10000` — exit 0; `Test Files 5 passed (5); Tests 119 passed (119)`; duration 18.03 seconds. React Router future-flag warnings appeared during the UI file.
- Focused `npx eslint supabase/functions/support-chat/prompt.ts supabase/functions/support-chat/policy.test.ts src/support-chat-security.test.ts src/components/support/display-safety.ts src/components/support/display-safety.test.ts` — exit 0, no output or findings.

The full suite, repository-wide lint, and live browser/Supabase/Deno/provider checks were not rerun. Their earlier limitations remain unchanged.

## Final fix — whole-branch security findings

Starting HEAD: `4642c641e83a88365ffa64d922dbb8fb7b3e40dc`. The shared classifier now refuses exact personal/account financial amounts in the current message or any history turn before knowledge retrieval, caller summary RPCs, or provider input. It also refuses mixed declaration-status and FileSmart document/upload/process probes. Server and client output filters remove account-specific amount phrasing, including `The amount on your account is 4,000,000.`, while preserving public statutory amount explanations such as the VAT registration threshold. Handler tests cover the short circuit and the actual provider wire request; UI tests cover rendered output. CORS, authentication, rate limits, DTO projection, prior filename/PII/workflow refusals, AppLayout, Messages, accessibility, and deployment documentation were left intact.

- Initial sandboxed `npm test -- supabase/functions/support-chat/policy.test.ts supabase/functions/support-chat/handler.test.ts src/support-chat-security.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism --testTimeout=10000` — exit 1 before tests ran: Vitest could not load `vitest.config.ts` because the sandbox denied access to an ancestor directory. The same test set was rerun outside the sandbox.
- RED, same command outside the sandbox — exit 1: `Test Files 5 failed (5); Tests 15 failed | 122 passed (137)`. The new classifier, handler, server-sanitizer, client-filter, and rendered UI cases exposed the reported leaks. React Router future-flag warnings appeared during the UI file.
- GREEN, same five files with `--reporter=dot` — exit 0: `Test Files 5 passed (5); Tests 137 passed (137)`. React Router future-flag warnings only.
- Final serial focused command, `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx src/lib/support-chat.test.ts src/App.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 0: `Test Files 7 passed (7); Tests 154 passed (154)`. This includes the provider wire-request regression and the existing handler, client, AppLayout, and Messages tests. React Router future-flag warnings only.
- `npx eslint supabase/functions/support-chat/policy.ts supabase/functions/support-chat/policy.test.ts supabase/functions/support-chat/prompt.ts supabase/functions/support-chat/handler.test.ts src/support-chat-security.test.ts src/components/support/display-safety.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx` — exit 0, no ESLint findings.
- `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --allowImportingTsExtensions supabase/functions/support-chat/policy.ts supabase/functions/support-chat/prompt.ts supabase/functions/support-chat/handler.test.ts` — exit 0, no diagnostics.
- `npx tsc --noEmit -p tsconfig.app.json` — exit 1 with 14 diagnostics: `App.test.tsx` (1), `DocumentsStep.tsx` (2), `SyncContext.test.tsx` (1), `account-deletion.test.ts` (1), `api.test.ts` (2), `auth-gateway.test.ts` (3), `auth.ts` (1), `SubmissionDetail.tsx` (2), and the existing `Object.hasOwn`/ES2022 target diagnostic in `support-chat/handler.ts` (1). None is in a file changed by this fix. The app-wide type check is not claimed green.

No full-suite, repository-wide lint, live deployment, browser-preview, Supabase/RLS, Deno, provider-service, DNS/egress, or production-gate pass is claimed in this round. The earlier deployment checklist remains pending.

## Final fix round — residual account and workflow bypasses

Starting HEAD: `cd356cfe4eec71b04da520b4a4f17596b32be8a1`. The shared classifier now catches account-specific amounts after account verb variants such as `contains`, `has`, and `holds`, and refuses account-status questions mixed with uploaded-document storage, retention, or process handling probes even without the product name. Server and client sanitizers remove all matching account-amount spans across line breaks while retaining public VAT threshold explanations. Existing authenticated read-only, workflow, document-content, PII, transcript, CORS, rate-limit, DTO, AppLayout, Messages, accessibility, and deployment boundaries remain unchanged.

- RED: `npm test -- supabase/functions/support-chat/policy.test.ts supabase/functions/support-chat/handler.test.ts src/support-chat-security.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 1; `Test Files 4 failed (4); Tests 17 failed | 136 passed (153)`. The new account-verb, product-name-free mixed-workflow, and cross-line sanitizer regressions failed as expected.
- Final serial focused command: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx src/lib/support-chat.test.ts src/App.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 0; `Test Files 7 passed (7); Tests 169 passed (169)`. React Router future-flag warnings only.
- Focused ESLint over changed support code/tests — exit 0, no findings.
- Focused Edge TypeScript check with ES2022 target — exit 0, no diagnostics.
- `npx tsc --noEmit -p tsconfig.app.json` — exit 1 with the same 14 existing diagnostics outside this fix, including the pre-existing `Object.hasOwn` target diagnostic in `supabase/functions/support-chat/handler.ts`; no new app type claim is made.

No full-suite, repository-wide lint, live deployment, browser-preview, Supabase/RLS, Deno, provider-service, DNS/egress, or production-gate pass is claimed.

## Final fix round — order-independent amounts and document workflow boundary

Starting HEAD: `51ad5469650be5745eae04f7a0a0083be4d778e6`. The policy classifier now uses normalized, order-independent personal/account amount detection across account verb variants, currency forms, and line breaks before knowledge retrieval, summary RPCs, or provider input. Document/upload/storage/retention/process questions now refuse regardless of whether FileSmart is named. Server and client sanitizers remove complete account-specific amount lines across line breaks while preserving public VAT threshold education.

- RED: the initial five-file focused command — exit 1; `Test Files 3 failed; Tests 26 failed | 154 passed (180)`. The new order-independent amount, document-workflow, and sanitizer regressions failed before the production fix.
- Final focused command: `npm test -- supabase/functions/support-chat/policy.test.ts supabase/functions/support-chat/handler.test.ts src/support-chat-security.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 0; `Test Files 5 passed (5); Tests 180 passed (180)`. React Router future-flag warnings only.
- Final serial focused command: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx src/lib/support-chat.test.ts src/App.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 0; `Test Files 7 passed (7); Tests 196 passed (196)`. React Router future-flag warnings only.
- Focused ESLint over changed support code/tests — exit 0, no findings.
- Focused Edge TypeScript check with ES2022 target — exit 0, no diagnostics.

No full-suite, repository-wide lint, live deployment, browser-preview, Supabase/RLS, Deno, provider-service, DNS/egress, or production-gate pass is claimed. Pre-existing untracked artifacts were not touched.

## Final hardening round — arbitrary amounts, cross-turn reconstruction, and v1 document boundary

Starting HEAD: `3c8e93c`. The support classifier now treats any numeric token as sensitive when associated with personal/account ownership terms in either order, after Unicode whitespace/newline normalization, while retaining public VAT threshold education. The handler classifies the normalized current message plus all history before knowledge retrieval, summary RPCs, or provider input; cross-turn reconstruction is refused and raw sensitive history is not forwarded. Document/file handling questions are refused regardless of product name or word order. Server and client response sanitizers now inspect the entire normalized response, fail closed to their safe fallback for forbidden account amounts, workflow/document handling, PII, filenames, DTOs, or internal content, and recognize labels such as `Account holder:` while retaining safe public VAT explanations and official citation URLs.

Regression evidence completed before the user-directed stop:

- Initial focused RED: `npm test -- supabase/functions/support-chat/policy.test.ts supabase/functions/support-chat/handler.test.ts src/support-chat-security.test.ts src/components/support/display-safety.test.ts --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 1; 21 failures and 159 passes.
- Intermediate focused RED after the first implementation: same command — exit 1; 2 failures and 178 passes. The remaining issues were the irregular verb `kept` and one stale partial-redaction expectation.
- Focused GREEN before the final UI expectation update: same command — exit 0; 4 files, 180 tests passed.
- Requested 7-file serial run before the final UI expectation update: `npm test -- src/support-chat-security.test.ts supabase/functions/support-chat/handler.test.ts supabase/functions/support-chat/policy.test.ts src/components/support/display-safety.test.ts src/components/support/SupportChat.test.tsx src/lib/support-chat.test.ts src/App.test.tsx --no-file-parallelism --testTimeout=10000 --reporter=dot` — exit 1; 6 files passed, 210 tests passed, and 2 existing UI assertions failed because they still expected partial redaction.
- The two UI assertions were updated to the new fail-closed fallback contract after that run. Per the user request, no rerun, focused ESLint, Edge TypeScript check, or additional verification was performed after this final edit.

The commit therefore contains the implementation and regression coverage, but the final post-edit verification is incomplete. Pre-existing untracked artifacts were not touched.
