# Implementation Record

> **Current-status authority:** The dated reconciliation below supersedes older snapshots in this record. Earlier entries are retained as historical evidence and may contain pre-merge counts or deployment states.

## Current reconciliation — October 30, 2026

### Repository and merge state

- Authoritative production baseline: `taxapp/main` at `3856780` (PR #37, following the merged PR #36 and earlier PRs #34 and #35).
- PRs #34, #35, #36, and #37 are merged; there are no open pull requests for the completed documentation/prototype sequence.
- The prior review branches are retained for history. This follow-up documentation is being prepared on `codex/open-work-followups-20261029`, cut from the merged production baseline.
- The follow-up branch is isolated from the stale mixed-change checkout and contains only documentation and an explicitly unconnected React Router SSR prototype; it contains no tax-rule, database, secret, or production configuration changes. PR #37 merged the controlled-validation request and record updates into `main` at `3856780`.

### Current verification state

- `npm run lint`: passed with 0 errors and 0 warnings on the merged baseline.
- Full parallel suite after the timeout fix: 122 test files and 869 tests passed on the merged baseline; this follow-up branch adds 1 adapter test file and the serial suite passes 123 files / 874 tests.
- `npm run verify:public`: passed with 15 HTML files, 14 crawlable pages, 14 sitemap URLs, complete H1/canonical coverage, and a branded 404.
- `npm run verify:filing-evidence`: passed with 37 rows and 0 publicly verified rows.
- Production smoke checks: homepage, calculator, waitlist, education, filing directory, sitemap, robots, CSP, console errors, and real 404 behavior passed on the live Cloudflare-served site after the merged `72b3455` build.
- Cloudflare production provenance is verified in the authenticated Pages dashboard: `main` commit `72b3455`, deployment URL `https://05bc332b.filesmartnaija.pages.dev`, and live custom domain `https://www.filesmartnaija.com`. No additional production deployment was triggered by this follow-up.

### Open-work status

| Work item | Current status | Next action or dependency |
|---|---|---|
| Implementation-record reconciliation | `COMPLETE_FOR_REVIEW` | The current baseline, merged PR provenance, evidence queue, and historical snapshot boundary are reconciled. |
| Filing-directory evidence research | `IN_PROGRESS` | Use the controlled-validation request for Bayelsa, Delta, Bauchi, Imo, and Kaduna; do not promote public statuses without current-period workflow evidence and second review. |
| Current preview Fast 3G trace | `READY_FOR_REVIEW` | The calculator first-paint fix is measured and merged; no additional shared-vendor split is justified without a fresh deployed Fast 3G trace for all three routes. |
| React Router v7 remediation | `READY_FOR_REVIEW` | Migration matrix and SSR adapter prototype are prepared; create a dedicated migration branch before installing v7 and do not upgrade the production branch. |
| Cloudflare deployment provenance | `VERIFIED` | Production `main` row, commit `72b3455`, deployment URL, and live custom domain were confirmed in the authenticated Pages dashboard. |
| Search Console/AEO refresh | `WAITING_EXTERNAL_DATA` | October 29 recheck unchanged: sitemap successful with 12 discovered pages; indexing still processing. |
| Legal/data-protection review | `BLOCKED` | Requires qualified Nigerian legal review. |
| Tax content/calculation review | `BLOCKED` | Requires qualified Nigerian tax-professional review. |

No public filing-directory status, tax calculation, production configuration, database schema, or secret was changed by this reconciliation. The merged PR #37 was documentation-only and did not require a production deployment.

## Approved scope

Local development implementation of public rendering/indexability (FS-03), public SEO metadata and sitemap (FS-05), pricing discovery in the launch conversion journey (FS-07), privacy-safe event contracts (FS-08), calculator UX hardening (FS-06), an evidence-first filing-directory foundation (FS-10), and the owner-approved draft legal package. No production deployment, production database changes, or live tax-rule changes were performed.

## Current state

- Branch: `codex/public-seo-conversion`
- Base: `taxapp/main` at `8ff36e7551f0164cdcc3e47dcf1771ee4cbf4e90`
- FS-03: `READY_FOR_REVIEW` — SSR/prerender and 404 implementation complete locally.
- FS-05: `READY_FOR_REVIEW` — metadata, sitemap and robots changes complete locally.
- FS-07 pricing path: `READY_FOR_REVIEW` — Pricing nav reaches account-gated `/pricing`.
- FS-06 calculator UX: `READY_FOR_REVIEW` — numeric input semantics, empty-submit guidance, zero-tax positive-income coverage, and no-submission behavior are tested; formulas are unchanged.
- FS-06 public route decision: `READY_FOR_REVIEW` — `/calculator` remains the single canonical public estimator route; no duplicate `/tools/paye-calculator` alias or monthly tax-rule variant was introduced.
- FS-06 pre-review calculation safeguards: `READY_FOR_REVIEW` — optional rent, insurance, mortgage, and employment-context facts are captured; ambiguous facts fail closed for numeric estimates while preparations remain savable; the approved formula and tax bands are unchanged.
- FS-08 measurement contract: `READY_FOR_REVIEW` — browser-local, allowlisted events only; no analytics provider or network transmission enabled.
- FS-10 filing directory: `READY_FOR_REVIEW` — public `/filing-directory` lists all 37 jurisdictions while keeping online service and individual PIT status separately unverified until source evidence exists.
- Registry trust boundary: `READY_FOR_REVIEW` — refreshed evidence requires HTTPS `.gov.ng` sources and cannot rename bundled jurisdictions.
- Deadline freshness: `READY_FOR_REVIEW` — invalid IANA time zones and evidence older than one quarterly review cycle resolve conservatively as stale.
- Legal draft package: `READY_FOR_REVIEW` — FileSmart BridgeIQ LTD, the supplied Ogun State address, `hello@filesmartnaija.com`, the October 27, 2026 effective date, Nigerian-law-oriented privacy rights/deletion language, retention schedule, UGC terms, and dispute language are reflected locally; external Nigerian legal and data-protection review remains required. Pages remain visibly marked as drafts.
- CI quality gates: `READY_FOR_REVIEW` — pull requests and main-branch pushes run typecheck, lint, tests, both builds, and generated-output hygiene checks.
- AEO benchmark: `IN_PROGRESS` — 40-question measurement template added; repeated site-restricted searches on October 28, 2026 returned no results. Search Console now confirms sitemap success with 12 discovered pages, but performance and page-indexing surfaces are still processing, so no visibility claim is made and the rows remain `NOT_RUN`.
- AEO/Search Console runbook: `READY_FOR_REVIEW` — documented repeatable Search Console and accessible-browser measurement steps with evidence and acceptance rules; no credentials or verification tokens were added.
- Filing evidence contract: `READY_FOR_REVIEW` — verified directory claims now require official `.gov.ng` source evidence, dated review, reviewer, service period, confidence, and limitations; all current rows remain unverified.
- CI supply-chain hardening: `READY_FOR_REVIEW` — checkout and setup-node actions are pinned to verified v4.4.0 commit SHAs.
- Local dependency audit: `READY_FOR_REVIEW` — removed the unnecessary `zod` production dependency and replaced the vulnerable `xlsx` production dependency with a dependency-free, write-only OOXML exporter covered by structural archive tests; `npm audit --omit=dev --audit-level=high` now reports only the unresolved React Router findings, with no breaking force-fix applied.
- Public output verification: `READY_FOR_REVIEW` — a reusable verifier checks prerendered page count, H1/canonical coverage, sitemap parity, and the 404 fallback in both local and CI builds.
- Filing evidence register: `READY_FOR_REVIEW` — all 37 jurisdiction rows are represented with conservative unverified status and blank evidence fields until reviewed sources are attached.
- Filing evidence discovery: `READY_FOR_REVIEW` — official-source candidates for the remaining jurisdictions were expanded on October 28, 2026 without changing the public registry; no credentials, forms, or authority APIs were accessed.
- Filing evidence follow-up research: `READY_FOR_REVIEW` — the October 28 official-source pass narrowed the validation queue and recorded source-backed candidates for Adamawa, Akwa Ibom, Bauchi, Benue, Imo, Kaduna, Kogi, Sokoto, and Yobe, while preserving conservative `not_verified` public statuses until current-period workflow confirmation and second review.
- Filing evidence recheck: `READY_FOR_REVIEW` — the October 28 recheck captured direct FCT-IRS online filing instructions, an Oyo portal/guidance conflict, and access limitations for Ogun and Anambra; no jurisdiction status was promoted without second review.
- Filing evidence follow-up pass: `READY_FOR_REVIEW` — official-source material for Delta, Ekiti, Gombe, and Niger was refreshed on October 29. Delta has the strongest Form A lead, while the other three remain assessment, registration, payment, or general-obligation evidence only. All 37 public rows remain `not_verified` pending controlled workflow confirmation and second review.
- Filing evidence current-source refresh: `READY_FOR_REVIEW` — Delta's official portal, self-service page, and state progress report provide the strongest discovery lead for annual-return filing; Ekiti, Gombe, and Niger still lack publicly exposed individual PIT submission workflows. No public status changed.
- Filing evidence additional queue: `READY_FOR_REVIEW` — official-source discovery added Bauchi, Imo, Kaduna, Sokoto, and Yobe as stronger controlled-validation candidates, while Adamawa, Akwa Ibom, and Kogi remain payment, employer/PAYE, business, or general-return evidence only. All 37 public rows remain `not_verified`.
- Filing evidence follow-up pass 2: `READY_FOR_REVIEW` — official/public source discovery on October 29 added Bayelsa's annual-returns e-filing lead, Benue's general online tax-return claim, and Taraba's self-assessment/invoicing/payment evidence. None establishes a current-period individual PIT workflow or authority acceptance, so all 37 public rows remain `not_verified`.
- Controlled validation request: `READY_FOR_REVIEW` — added `docs/filing-directory-controlled-validation-request.md` as a reusable evidence request for authority-assisted or test-account workflow checks. It defines the required individual PIT/Form A path, assessment year, submission acknowledgement, payment relationship, current-period availability, reviewer identity, redaction rules, and the two-review threshold for changing public statuses.
- Filing evidence official-source refresh: `IN_PROGRESS` — the October 30 refresh strengthened Bayelsa and Delta as the first controlled-validation targets and added stronger official annual-return/Form A leads for Imo and Kaduna. No public status changed; all 37 rows remain `not_verified`.
- Evidence-register guard: `READY_FOR_REVIEW` — CI can validate row count, status discipline, source format, review metadata, and prevention of partial evidence.
- CSV escaping support: `READY_FOR_REVIEW` — evidence-register validation now accepts quoted fields containing commas and doubled quotes while rejecting malformed quoted fields.
- Route/accessibility smoke coverage: `READY_FOR_REVIEW` — public route tests cover H1 rendering and navigation/home affordances across 13 public routes; calculator behavior remains covered by dedicated tests.
- Test harness stability: `READY_FOR_REVIEW` — App and onboarding route tests now await asynchronous route rendering and explicitly clean up DOM state, preventing duplicate-render and timeout failures under the full parallel suite.
- Bundle-performance analysis: `READY_FOR_REVIEW` — production build sizes and lazy-loading boundaries are documented; PDF/XLSX exporters are already deferred and no additional safe split was justified without a fresh three-route trace. The post-optimization Cloudflare preview records the shared 628 KB same-origin asset footprint, while the calculator-only Lighthouse trace is documented separately; repeat the full Fast 3G comparison against the deployed preview before shared-vendor changes.
- Vendor-optimization decision: `READY_FOR_REVIEW` — the three-route Fast 3G trace shows material calculator impact (score 77, 530 ms TBT), justifying targeted profiling, but does not attribute the cost to a specific shared vendor. No vendor split is applied until an isolated before/after profile demonstrates a measurable user-facing benefit.
- Public cold-load measurement: `READY_FOR_REVIEW` — repeatable route-load measurement script follows same-origin canonical redirects and records HTML bytes, same-origin asset bytes, final status, and fetch timing for `/`, `/calculator`, and `/filing-waitlist`.
- Supplementary browser performance trace: `READY_FOR_REVIEW` — the gstack browser was built and captured real browser timings at a 390×844 viewport for `/`, `/calculator`, and `/filing-waitlist`. The tool has no network-condition emulation, so the trace is not a Fast 3G result. The dedicated calculator first-paint trace improved the calculator Lighthouse score from 83 to 93, LCP from 3.31 s to 2.12 s, and TBT from 295 ms to 224 ms without a meaningful transfer-size increase. A fresh deployed Fast 3G trace across all three routes remains required before another shared-vendor change.
- Filing waitlist edge route: `READY_FOR_REVIEW` — `/filing-waitlist` now has a dedicated generated `noindex, nofollow` HTML page outside the sitemap, and the conflicting SPA rewrite was removed so Cloudflare Pages can serve the static route instead of redirecting it to `/`.
- React Router compatibility spike: `READY_FOR_REVIEW` — the isolated SSR adapter prototype in `scripts/router-v7-ssr-adapter-prototype.ts` resolves named and namespace-shaped `StaticRouter` exports and fails closed for missing exports. Four focused tests pass. The prototype is not wired to the production prerenderer and the v6 dependency remains unchanged.
- React Router v7 migration matrix: `READY_FOR_REVIEW` — added `docs/security/react-router-v7-migration-matrix.md` with public/private route fixtures, launch-gate and auth-state coverage, SSR/prerender acceptance gates, Cloudflare preview checks, audit review, and rollback boundaries. No v7 dependency or production prerender change was applied.
- Local SEO/AEO content audit: `READY_FOR_REVIEW` — repository metadata, prerendered HTML, source-backed guide fields, legal draft status, and the unexecuted external AEO benchmark are documented.
- Staging smoke and rollback preparation: `READY_FOR_REVIEW` — staging checklist and non-destructive hosting/database rollback plan are documented; the Cloudflare preview was validated without changing production.
- Cloudflare deployment verifier: `READY_FOR_REVIEW` — reusable HTTPS route verifier and tests are implemented; the invalid Cloudflare `_redirects` 404 rewrite was removed because Pages supports a top-level `404.html` but not 404 rewrites. The existing `filesmartnaija` Pages project is Git-connected to `edwardabiodun-hub/Taxapp` on `main` with `npm run build:public` and `dist-public`. Both stale Bun lockfiles (`bun.lock` and `bun.lockb`) were removed so Cloudflare can use the tested npm `package-lock.json` instead of failing frozen-install checks. The stable preview `https://codex-public-seo-conversion.filesmartnaija.pages.dev` passes representative route checks, including same-origin `308` canonical redirects followed by `200` and a real `404` for the unknown-route probe.
- CI Cloudflare gate: `READY_FOR_REVIEW` — quality gates now run the Cloudflare verifier automatically with the repository variable `CLOUDFLARE_STAGING_URL` configured to the stable branch preview `https://codex-public-seo-conversion.filesmartnaija.pages.dev`.
- Cloudflare staging access runbook: `READY_FOR_REVIEW` — documented Git-connected preview setup, Direct Upload alternatives, preview protection, least-privilege access, and the required handoff values.
- Waitlist route preview validation: `READY_FOR_REVIEW` — deployed commit `126a229` to the non-production preview `https://codex-public-seo-conversion-rm52.filesmartnaija.pages.dev`; representative route verification passed, the unknown-route probe returned `404`, `/filing-waitlist/` returned `200` with its branded H1 and `noindex, nofollow`, and the waitlist remained absent from the sitemap. The production custom domain was not changed.
- Local preview smoke: `READY_FOR_REVIEW` — production-equivalent Vite preview returned 200 for the representative public routes; unknown-route behavior remains a hosting-specific staging check because Vite preview serves the SPA fallback instead of the deployed static 404 response.
- Production rollout: `NOT_STARTED` — requires separate explicit authorization and staging validation; no production deployment was triggered by the GitHub connection.
- External legal/data-protection review and qualified tax content review: `BLOCKED` pending qualified Nigerian professional review; the owner-approved local legal draft is implemented and remains explicitly marked as draft.

## Files changed

- `package.json`
- `package-lock.json`
- `public/_redirects`
- `public/robots.txt`
- `public/sitemap.xml`
- `src/PublicApp.tsx`
- `src/PublicApp.test.tsx`
- `src/components/public/PublicNav.tsx`
- `src/components/public/PublicNav.test.tsx`
- `src/components/public/PublicNotFound.tsx`
- `src/lib/public-document.ts`
- `src/lib/public-document.test.ts`
- `src/lib/public-routes.ts`
- `src/lib/public-routes.test.ts`
- `src/pages/TaxCalculator.tsx`
- `src/pages/TaxCalculator.test.tsx`
- `src/types/declaration.ts`
- `src/lib/tax-calculator.ts`
- `src/lib/tax-calculator.test.ts`
- `src/components/declaration/DeductionsStep.tsx`
- `src/components/declaration/DeductionsStep.test.tsx`
- `src/components/declaration/EarnedIncomeStep.tsx`
- `src/components/declaration/ReviewStep.tsx`
- `src/components/declaration/__tests__/ReviewStep.test.tsx`
- `src/lib/exports/export-data.ts`
- `src/lib/__tests__/export-service.test.ts`
- `src/pages/LegalPage.tsx`
- `src/pages/LegalPages.test.tsx`
- `src/pages/Privacy.tsx`
- `src/pages/Terms.tsx`
- `src/pages/Disclaimer.tsx`
- `src/pages/FilingDirectory.tsx`
- `src/domain/filing-directory.ts`
- `src/domain/filing-directory.test.ts`
- `src/lib/analytics.ts`
- `src/lib/analytics.test.ts`
- `src/lib/jurisdiction-service.ts`
- `src/lib/__tests__/feature-flags.test.ts`
- `src/lib/glossary.ts`
- `src/lib/glossary.test.ts`
- `src/lib/deadline-service.ts`
- `src/lib/__tests__/deadline-service.test.ts`
- `.github/workflows/quality-gates.yml`
- `vitest.config.ts`
- `scripts/verify-public-output.mjs`
- `scripts/verify-public-output.test.ts`
- `scripts/verify-cloudflare-deployment.mjs`
- `scripts/verify-cloudflare-deployment.test.ts`
- `scripts/measure-public-load.mjs`
- `scripts/measure-public-load.test.ts`
- `docs/seo/search-console-aeo-runbook.md`
- `docs/security/dependency-advisories.md`
- `docs/security/react-router-v7-compatibility.md`
- `docs/security/react-router-v7-ssr-adapter-prototype.md`
- `docs/filing-directory-evidence-register.csv`
- `docs/filing-directory-evidence-discovery-2026-10-27.md`
- `docs/filing-directory-evidence-recheck-2026-10-29.md`
- `scripts/verify-filing-evidence-register.mjs`
- `scripts/verify-filing-evidence-register.test.ts`
- `docs/performance/bundle-analysis-2026-10-27.md`
- `docs/performance/calculator-first-paint-2026-10-29.md`
- `docs/filing-directory-evidence-recheck-2026-10-29-follow-up.md`
- `scripts/router-v7-ssr-adapter-prototype.ts`
- `scripts/router-v7-ssr-adapter-prototype.test.ts`
- `docs/seo/content-quality-audit-2026-10-27.md`
- `docs/superpowers/staging-smoke-test-checklist.md`
- `docs/superpowers/cloudflare-staging-access.md`
- `docs/superpowers/rollback-plan.md`
- `docs/filing-directory-source-verification.md`
- `docs/seo/aeo-benchmark.md`
- `src/public-main.tsx`
- `scripts/build-public.mjs`
- `scripts/prerender-public.mjs`
- `docs/superpowers/plans/2026-10-26-public-seo-conversion.md`

## Verification

- Focused pre-review readiness suite: 5 files, 63 tests passed.
- Legal-page verification: 1 file, 12 tests passed; confirmed entity, address, privacy contact, October 27, 2026 effective date, retention schedule, data-subject rights, deletion process, dispute safeguards, and the visible draft notice.
- Full suite: 117 test files, 857 tests passed in a clean serial run. A parallel run remains order-sensitive in five existing app/onboarding tests; the reliable serial mode completed cleanly and still emits existing React Router and Supabase test-environment warnings.
- Pricing test uses a deterministic catalog mock and awaits its async load, eliminating the prior unhandled teardown rejection in the full suite.
- `npm run build:public`: passed; generated 14 public routes and `404.html`, including `/filing-directory`.
- `npm run build`: passed.
- `npm run lint`: passed with 0 errors and 14 warnings already present elsewhere in the repository.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- Static-output inspection: all 14 public route files have an H1 and canonical URL; sitemap has 14 entries; calculator and filing directory are crawlable; pricing is absent from generated pages; 404 has `noindex, nofollow` and no canonical.
- Public output verifier: passed; 14 prerendered pages, 14 sitemap URLs, no missing H1/canonical fields, and `404.html` present.
- Dependency review artifact: `npm audit --omit=dev --audit-level=high` now reports two unresolved moderate React Router advisories whose available remediation is the breaking React Router 7 upgrade. `zod` and `xlsx` are no longer production dependencies; no force upgrade was applied.
- Filing evidence register verifier: passed; 37 rows, zero verified rows, and no partial evidence on unreviewed entries.
- CSV escaping regression: passed; quoted comma fields and doubled quotes are accepted by the evidence-register parser.
- Public route smoke coverage: passed; 13 route cases plus existing public-route tests passed, with expected H1 and navigation/home affordances.
- Local preview smoke: passed for representative route reachability; the expected Vite SPA fallback on an unknown route was observed and is not treated as Cloudflare 404 validation.
- Bundle analysis: passed; `npm run build` completed successfully. Large exporter chunks remain deferred and the entry chunk remains an optimization backlog item.
- Public cold-load measurement: passed against the stable Cloudflare branch preview; same-origin redirect handling is covered by 3 focused tests and the live baseline is recorded separately below. This remains a network-footprint baseline, not a throttled real-browser trace.
- React Router compatibility: passed as an assessment; candidate `7.18.5` supports the current React/Node floors, but the migration remains deferred to an isolated compatibility branch.
- Dependency remediation: passed; the glossary validator, Cloudflare verifier, and public-load measurement focused tests pass, and the post-change audit no longer reports `zod`.
- Cloudflare verifier: focused tests passed (4 tests). The preview deployment from commit `59f98db` at `https://public-seo-conversion.filesmartnaija.pages.dev` (deployment URL `https://bfa9ebca.filesmartnaija.pages.dev`) passed all seven public route checks after following same-origin trailing-slash redirects and returned `404` for the unknown-route probe. The production custom domain was not changed.
- Public-load measurement tests: passed (3 tests); the stable Cloudflare branch preview recorded 33.3–35.7 kB HTML and 628.2 kB same-origin initial assets for the tested routes after following canonical redirects.
- Calculator first-paint evidence: passed; Lighthouse 13.6.0 on the fresh mobile preview recorded score 93, FCP/LCP 2.12 s, TBT 224 ms, CLS 0, and approximately 282 KiB total byte weight. The detailed comparison is recorded in `docs/performance/calculator-first-paint-2026-10-29.md`.
- React Router SSR adapter prototype: passed; `npx vitest run scripts/router-v7-ssr-adapter-prototype.test.ts` completed with 1 file and 4 tests passed. The prototype is intentionally disconnected from the production prerenderer.
- AEO browser/search attempts: eight site-restricted searches across October 27–28 returned no surfaced FileSmart results. Search Console sitemap status is successful, with 12 discovered pages, while performance and indexing data remain in processing. This is recorded as no measurable visibility observation, not as proof that the site is inaccessible to search or answer engines.
- Current-period jurisdiction validation: official-source rechecks found live individual filing or returns evidence for FCT, Lagos, Kano, Kwara, and Edo; Oyo's portal is reachable but its guidance is not sufficient to confirm the exact public PIT workflow; Ogun timed out and Anambra exposed insufficient filing text. No jurisdiction was promoted to the public verified register; second-review evidence remains required.
- React Router v7 spike: isolated branch `codex/react-router-v7-spike` at `ce49098` passed typecheck, 118-file/860-test suite, and lint with existing warnings, but failed the public prerender/verification path because v7.18.5's SSR package exports do not match the current Vite 5 prerender setup. The upgrade remains unmerged and deferred pending an SSR-compatible migration design.
- Public bundle optimization: `AuthProvider` and public support chat now dynamically load the Supabase client. The public build no longer module-preloads the 226.68 kB Supabase vendor; the deployed preview measured 401.8 kB of initial same-origin assets across `/`, `/calculator`, and `/filing-waitlist`. Full regression coverage passed with 120 test files and 865 tests after the waitlist-route regression test was added. A real-browser mobile-viewport trace and an independent Lighthouse Fast 3G lab trace are recorded separately.
- Review-fact validation: passed; ambiguous rent periods/shared rent, insurance timing, mortgage residence, and minimum-wage employment context withhold numeric estimates without blocking preparation save/export.
- Export provenance: passed; safe exports retain review facts and state that they are estimates/not submitted and remain subject to the relevant authority's requirements.
- Documentation and staging checkpoint verification: focused edge/evidence/output checks passed (12 tests). After hardening the affected test harness, the full `npm test -- --run` run passed with 118 test files and 860/860 tests.
- Latest route-output validation: focused route/output tests passed (8 tests), `npm run build:public` passed, and `npm run verify:public` reported 15 HTML pages, 14 crawlable pages, 14 sitemap URLs, no missing H1/canonical metadata, and a branded 404. The full suite produced one parallel-run timeout in the existing `src/App.test.tsx` brand-new-user case; that file passed in isolation with 11/11 tests. Lint passed with 14 pre-existing warnings and 0 errors. `npm audit --omit=dev --audit-level=high` still reports only the known two moderate React Router advisories requiring a breaking upgrade.

## Follow-up validation — October 28, 2026

- Fast 3G Lighthouse trace: `READY_FOR_REVIEW` — Lighthouse 13.6.0 was run against the preview with a fresh mobile context, cache disabled, and 150 ms/1.6 Mbps/750 Kbps DevTools throttling. Scores were 90 for `/`, 86 for `/calculator/`, and 97 for `/filing-waitlist/`; the calculator's main opportunities were shared Supabase and motion JavaScript. PageSpeed Insights API requests returned HTTP 429 daily-quota exhaustion, so these are lab results rather than PSI field data.
- Shared-vendor decision: `DEFERRED` — current trace quality and existing public Supabase deferral do not justify another shared-vendor split. The next safe optimization is field-data or interaction-trace driven.
- Full-suite stabilization: `READY_FOR_REVIEW` — `npm run test:ci -- --run` now runs the suite with one worker. The equivalent serialized command passed 120 test files and 865 tests. The earlier parallel run's single `src/App.test.tsx` timeout is treated as resource contention/order sensitivity because the file passes in isolation and under the serialized suite; no test weakening or production change was made.
- React Router remediation: `READY_FOR_REVIEW` — npm audit still reports two moderate advisories against 6.30.6 with only a breaking 7.18.5 fix. The isolated v7 spike remains blocked by the current Vite 5 public-prerender SSR boundary; no v7 upgrade was applied.
- Search Console/AEO refresh: `READY_FOR_REVIEW` — Search Console shows the submitted sitemap as `Success`, last read October 28, with 12 discovered pages; Page indexing still reports “Processing data, please check again in a day or so.” Four fresh site-restricted AEO searches returned no surfaced FileSmart results; this is recorded as no measurable visibility observation, not proof of non-indexing.
- Filing-directory evidence refresh: `READY_FOR_REVIEW` — official-source research refreshed Kaduna, Kogi, and Yobe as strong validation candidates, while keeping all public statuses conservative and unverified pending workflow-level evidence and second review.
- Accessibility/route smoke expansion: `READY_FOR_REVIEW` — public route tests now include the filing-waitlist route's H1, email field, consent checkbox, and home-navigation affordance; existing mobile-nav keyboard/state and waitlist consent/error tests remain green.
- Staging/rollback documentation: `READY_FOR_REVIEW` — the verified Cloudflare preview URL, deployment ID, waitlist canonical/noindex/sitemap behavior, and preview rollback reference are recorded in the staging checklist and rollback plan.

## Risks and next action

The documentation follow-up is merged into `taxapp/main` at `3856780`; production runtime provenance remains the last verified Cloudflare build from `72b3455`, and no production deployment was triggered by the documentation-only merge. Keep pricing behind account creation. Legal/privacy and tax content remain subject to professional approval; the current pages still visibly identify themselves as drafts. The pre-review calculation safeguards intentionally do not change tax law, bands, relief caps, deadlines, penalties, or authority-acceptance claims. Populate filing-directory rows only through a reviewed, source-backed process; do not convert the current discovery candidates into public claims without evidence and second review. Search Console setup is verified, but AEO benchmark visibility remains unconfirmed because Google is still processing indexing/performance data; do not rerun or mark benchmark rows complete until that external data becomes available. The remaining bundle warning is non-blocking; the calculator first-paint fix is documented and no further shared-vendor split is justified without a fresh deployed Fast 3G comparison. The isolated React Router adapter and migration matrix are planning artifacts only; do not upgrade or wire them into production until the migration gates pass on a dedicated branch.

## Corrected preview validation — October 28, 2026

- Public hydration hardening: `COMPLETE_FOR_REVIEW` — commits `e8035d6`, `660d7f3`, and `3a11b1b` align the public client with the prerendered HTML, remove public-only hydration side effects, and keep gated authenticated pages lazy. Fresh browser checks on the preview alias reported no console errors on `/`, `/calculator/`, `/filing-waitlist/`, or an unknown route.
- Cloudflare preview: `VERIFIED` — deployment `32d84ffa-c505-4526-9c69-23813bfedd8b` for commit `3a11b1b` is active at `https://32d84ffa.filesmartnaija.pages.dev`; the branch alias is `https://codex-public-seo-conversion.filesmartnaija.pages.dev`. Route verification passed for the public pages and returned a real `404` for an unknown path. The production custom domain was not changed.
- Corrected Fast 3G trace: `READY_FOR_REVIEW` — Lighthouse `13.6.0` on the latest preview recorded scores of 93 for `/`, 83 for `/calculator/`, and 95 for `/filing-waitlist/`. FCP/LCP were 2.43/2.43 seconds, 2.24/3.31 seconds, and 2.24/2.24 seconds respectively; CLS was zero on all three routes. The calculator's 295 ms TBT is the main route-specific concern.
- Shared-vendor decision: `DEFERRED` — the trace confirms shared JavaScript cost but does not justify another blind split after the public Supabase deferral and hydration fix. Use field data or an interaction trace to choose the next optimization.
- Full suite: `PASSED` — `npm run test:ci -- --run` completed in serialized mode with 120 test files and 865 tests. Existing React Router future-flag warnings remain informational.
- Checks: `PASSED_WITH_KNOWN_WARNINGS` — public output verification reports 15 HTML files, 14 crawlable pages, 14 sitemap URLs, no missing H1/canonical fields, and a branded 404. Filing evidence verification reports 37 rows and zero verified public rows. Lint has 0 errors and 14 pre-existing warnings. Production dependency audit reports only the two known moderate React Router advisories; v7 remains deferred.

## Current sequential work — October 28, 2026

- Cloudflare redirect hardening: `COMPLETE_FOR_REVIEW` — removed the invalid `/submissions/* /index.html 200` rule from `public/_redirects`, which could create an edge redirect loop. The valid exact `/submissions /index.html 200` route remains. Added a regression assertion in `src/lib/public-routes.test.ts`. The focused route test passed (5/5), and `npm run build:public` passed without the invalid-rule warning. Commit: `68c2740`.
- Lint cleanup: `COMPLETE_FOR_REVIEW` — reduced ESLint output from 14 warnings to 0 errors and 0 warnings. Intentional component-plus-hook/config exports now carry narrow rationale comments, and `NewDeclaration.tsx` uses a stable `handleSave` callback in the autosave effect. Targeted declaration/route tests passed (11/11). Commit: `9043715`.
- Filing-directory research: `READY_FOR_REVIEW` — added a dated official-source discovery pass for Jigawa, Katsina, Rivers, and Osun. All 37 register rows remain `unverified`; no public status or filing claim changed. The evidence-register verifier passed with 37 rows and 0 verified rows. Commit: `6edb4c`.
- Parallel-test investigation: `READY_FOR_REVIEW` — reproduced the full default Vitest run successfully: 120 test files and 865 tests passed in 74 seconds. `src/App.test.tsx` passed under the parallel runner; the previous timeout is best explained by async sync-retry leakage and route-render cleanup/order sensitivity, already addressed by the existing `syncAll` mock, realtime cleanup mock, explicit `cleanup()`, and async assertions. Serialized `npm run test:ci -- --run` remains the CI reliability guard. No test was weakened and no production behavior changed.
- PR preparation status: `IN_PROGRESS` — the branch contains the above three commits and is ready for final aggregate checks, implementation-record update, push, and reviewer handoff. Production has not been deployed or changed.

## Production smoke-test remediation — October 28, 2026

- Calculator submission hardening: `READY_FOR_REVIEW` — the public estimator now uses an explicit form submit handler, a submit-only calculate button, and non-submit secondary actions. Added a regression test covering the form-submit path and preserving the visible result. Focused calculator/security tests passed (9/9).
- Cloudflare Insights CSP: `READY_FOR_REVIEW` — `public/_headers` now explicitly permits the Cloudflare Insights script and its telemetry origin while retaining the existing restrictive defaults. Added header-contract assertions.
- Verification: `PASSED_WITH_KNOWN_WARNINGS` — lint passed with 0 warnings, `npm run build:public` passed, public output verification reported 15 HTML files and 14 sitemap URLs, and the serialized suite passed 120 files / 866 tests. The remaining Vite dynamic-import advisory and React Router audit advisories are unchanged.
- Deployment state: `NOT_DEPLOYED` — commit `994ac39` is local to the isolated branch. Production smoke testing must be repeated after this commit is merged and Cloudflare Pages rebuilds `main`.

## Current sequential work — October 29, 2026

- Documentation/prototype PR: `IN_REVIEW` — branch `codex/open-work-followups-20261029` is pushed to the `taxapp` remote at commit `dfd5bbe` and PR #36 is open: https://github.com/edwardabiodun-hub/Taxapp/pull/36. The PR contains documentation, evidence, and an isolated React Router SSR adapter prototype only; it has not been merged.
- Cloudflare preview provenance: `VERIFIED` — Cloudflare Pages deployed the latest PR commit as preview `https://0cf0b798.filesmartnaija.pages.dev`, deployment record `0cf0b798-07d3-4327-ab35-f1a9cef39c89`, from branch `codex/open-work-followups-20261029` and commit `35b5b7db777e9c2578ff59c8899a5ecd0f72d6d5`. Production remains on `main` at `72b3455`.
- Preview smoke tests: `PASSED` — on the latest `35b5b7d` preview, representative public routes returned 200 after expected trailing-slash redirects, the unknown-route probe returned a real 404, `/sitemap.xml` and `/robots.txt` returned 200, the waitlist page rendered its branded form and launch disclaimer, and CSP plus `X-Content-Type-Options: nosniff` were present. Browser console inspection reported no errors or warnings on the homepage, calculator, and waitlist routes.
- Three-route Fast 3G trace: `READY_FOR_REVIEW` — Lighthouse 13.6.0 with 150 ms RTT, 1.6 Mbps down, 750 Kbps up, 4× CPU and 390×844 mobile emulation recorded scores of 87 (`/`), 77 (`/calculator/`), and 89 (`/filing-waitlist/`). Calculator TBT was 530 ms; CLS was 0 on all routes. All routes loaded the same large shared vendor set, so targeted vendor isolation is justified as a follow-up, but no speculative bundler change was included in PR #36. Full evidence is in `docs/performance/fast3g-three-route-2026-10-29.md`.
- Filing evidence validation: `READY_FOR_REVIEW` — Bayelsa's official BIR and eTax portals exposed a current individual-return path and an initial self-assessment workflow; no personal data was entered and no submission or acknowledgement was generated. Benue exposed only an Angular app shell in the unauthenticated check; Taraba exposed self-assessment, invoices, payments, and receipts but no annual-return control. All 37 public statuses remain `not_verified` pending second review and workflow-level acceptance evidence.
- Search Console/AEO: `WAITING_EXTERNAL_DATA` — do not rerun until Google exposes usable indexing/performance data; the prior sitemap success does not by itself establish search visibility.
