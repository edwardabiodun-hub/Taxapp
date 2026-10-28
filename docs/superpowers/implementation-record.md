# Implementation Record

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
- Evidence-register guard: `READY_FOR_REVIEW` — CI can validate row count, status discipline, source format, review metadata, and prevention of partial evidence.
- CSV escaping support: `READY_FOR_REVIEW` — evidence-register validation now accepts quoted fields containing commas and doubled quotes while rejecting malformed quoted fields.
- Route/accessibility smoke coverage: `READY_FOR_REVIEW` — public route tests cover H1 rendering and navigation/home affordances across 13 public routes; calculator behavior remains covered by dedicated tests.
- Test harness stability: `READY_FOR_REVIEW` — App and onboarding route tests now await asynchronous route rendering and explicitly clean up DOM state, preventing duplicate-render and timeout failures under the full parallel suite.
- Bundle-performance analysis: `READY_FOR_REVIEW` — production build sizes and lazy-loading boundaries are documented; PDF/XLSX exporters are already deferred and no additional safe split was justified without browser traces. The post-optimization Cloudflare preview records the shared 628 KB same-origin asset footprint; the post-optimization throttled trace remains local-only and must be repeated against the deployed preview before shared-vendor changes.
- Public cold-load measurement: `READY_FOR_REVIEW` — repeatable route-load measurement script follows same-origin canonical redirects and records HTML bytes, same-origin asset bytes, final status, and fetch timing for `/`, `/calculator`, and `/filing-waitlist`.
- Supplementary browser performance trace: `READY_FOR_REVIEW` — the gstack browser was built and captured real browser timings at a 390×844 viewport for `/`, `/calculator`, and `/filing-waitlist`. The tool has no network-condition emulation, so the trace is not a Fast 3G result; the calculator route loaded in 523.5 ms and the homepage in 112.1 ms on a cached reload. The measured preview resolved `/filing-waitlist` to `/`; the local build now contains a dedicated static noindex route, which requires a subsequent preview deployment to verify at the edge.
- Filing waitlist edge route: `READY_FOR_REVIEW` — `/filing-waitlist` now has a dedicated generated `noindex, nofollow` HTML page outside the sitemap, and the conflicting SPA rewrite was removed so Cloudflare Pages can serve the static route instead of redirecting it to `/`.
- React Router compatibility spike: `READY_FOR_REVIEW` — inspected the v7 candidate, route API surface, prerenderer, auth/launch-gate route tables, and migration sequence; no major upgrade was applied to the mixed-change branch.
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
- `docs/filing-directory-evidence-register.csv`
- `docs/filing-directory-evidence-discovery-2026-10-27.md`
- `scripts/verify-filing-evidence-register.mjs`
- `scripts/verify-filing-evidence-register.test.ts`
- `docs/performance/bundle-analysis-2026-10-27.md`
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

The code is ready for review on the local branch, and the stable Cloudflare branch preview is validated at `https://codex-public-seo-conversion-rm52.filesmartnaija.pages.dev`. The repository variable `CLOUDFLARE_STAGING_URL` is configured to enable the automated edge gate on future CI runs. Do not promote to the live custom domain without separate explicit authorization. Keep pricing behind account creation. Legal/privacy and tax content remain subject to professional approval; the current pages still visibly identify themselves as drafts. The pre-review calculation safeguards intentionally do not change tax law, bands, relief caps, deadlines, penalties, or authority-acceptance claims. Populate filing-directory rows only through a reviewed, source-backed process; do not convert the current discovery candidates into public claims without evidence and second review. Search Console setup is verified, but AEO benchmark visibility remains unconfirmed because the repeat site-restricted searches surfaced no FileSmart results. The remaining bundle warning is non-blocking; the post-optimization preview confirms edge routing and shared-asset cost. The true Fast 3G lab trace is complete; PageSpeed Insights remained unavailable because its API quota was exhausted. The waitlist-route fix is now externally validated on the non-production preview; the production custom domain remains unchanged.

## Corrected preview validation — October 28, 2026

- Public hydration hardening: `COMPLETE_FOR_REVIEW` — commits `e8035d6`, `660d7f3`, and `3a11b1b` align the public client with the prerendered HTML, remove public-only hydration side effects, and keep gated authenticated pages lazy. Fresh browser checks on the preview alias reported no console errors on `/`, `/calculator/`, `/filing-waitlist/`, or an unknown route.
- Cloudflare preview: `VERIFIED` — deployment `32d84ffa-c505-4526-9c69-23813bfedd8b` for commit `3a11b1b` is active at `https://32d84ffa.filesmartnaija.pages.dev`; the branch alias is `https://codex-public-seo-conversion.filesmartnaija.pages.dev`. Route verification passed for the public pages and returned a real `404` for an unknown path. The production custom domain was not changed.
- Corrected Fast 3G trace: `READY_FOR_REVIEW` — Lighthouse `13.6.0` on the latest preview recorded scores of 93 for `/`, 83 for `/calculator/`, and 95 for `/filing-waitlist/`. FCP/LCP were 2.43/2.43 seconds, 2.24/3.31 seconds, and 2.24/2.24 seconds respectively; CLS was zero on all three routes. The calculator's 295 ms TBT is the main route-specific concern.
- Shared-vendor decision: `DEFERRED` — the trace confirms shared JavaScript cost but does not justify another blind split after the public Supabase deferral and hydration fix. Use field data or an interaction trace to choose the next optimization.
- Full suite: `PASSED` — `npm run test:ci -- --run` completed in serialized mode with 120 test files and 865 tests. Existing React Router future-flag warnings remain informational.
- Checks: `PASSED_WITH_KNOWN_WARNINGS` — public output verification reports 15 HTML files, 14 crawlable pages, 14 sitemap URLs, no missing H1/canonical fields, and a branded 404. Filing evidence verification reports 37 rows and zero verified public rows. Lint has 0 errors and 14 pre-existing warnings. Production dependency audit reports only the two known moderate React Router advisories; v7 remains deferred.
