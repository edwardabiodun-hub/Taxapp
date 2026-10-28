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
- AEO benchmark: `IN_PROGRESS` — 40-question measurement template added; an initial site-restricted search attempt returned no indexed results, so no visibility claim is made and the rows remain `NOT_RUN`.
- AEO/Search Console runbook: `READY_FOR_REVIEW` — documented repeatable Search Console and accessible-browser measurement steps with evidence and acceptance rules; no credentials or verification tokens were added.
- Filing evidence contract: `READY_FOR_REVIEW` — verified directory claims now require official `.gov.ng` source evidence, dated review, reviewer, service period, confidence, and limitations; all current rows remain unverified.
- CI supply-chain hardening: `READY_FOR_REVIEW` — checkout and setup-node actions are pinned to verified v4.4.0 commit SHAs.
- Local dependency audit: `READY_FOR_REVIEW` — removed the unnecessary `zod` production dependency and replaced the vulnerable `xlsx` production dependency with a dependency-free, write-only OOXML exporter covered by structural archive tests; `npm audit --omit=dev --audit-level=high` now reports only the unresolved React Router findings, with no breaking force-fix applied.
- Public output verification: `READY_FOR_REVIEW` — a reusable verifier checks prerendered page count, H1/canonical coverage, sitemap parity, and the 404 fallback in both local and CI builds.
- Filing evidence register: `READY_FOR_REVIEW` — all 37 jurisdiction rows are represented with conservative unverified status and blank evidence fields until reviewed sources are attached.
- Filing evidence discovery: `READY_FOR_REVIEW` — official-source candidates were recorded separately without changing the public registry; no credentials, forms, or authority APIs were accessed.
- Evidence-register guard: `READY_FOR_REVIEW` — CI can validate row count, status discipline, source format, review metadata, and prevention of partial evidence.
- CSV escaping support: `READY_FOR_REVIEW` — evidence-register validation now accepts quoted fields containing commas and doubled quotes while rejecting malformed quoted fields.
- Route/accessibility smoke coverage: `READY_FOR_REVIEW` — public route tests cover H1 rendering and navigation/home affordances across 13 public routes; calculator behavior remains covered by dedicated tests.
- Bundle-performance analysis: `READY_FOR_REVIEW` — production build sizes and lazy-loading boundaries are documented; PDF/XLSX exporters are already deferred and no additional safe split was justified without browser traces.
- Public cold-load measurement: `READY_FOR_REVIEW` — repeatable route-load measurement script added for `/`, `/calculator`, and `/filing-waitlist`; it records HTML bytes, same-origin asset bytes, status, and fetch timing without changing application behavior.
- React Router compatibility spike: `READY_FOR_REVIEW` — inspected the v7 candidate, route API surface, prerenderer, auth/launch-gate route tables, and migration sequence; no major upgrade was applied to the mixed-change branch.
- Local SEO/AEO content audit: `READY_FOR_REVIEW` — repository metadata, prerendered HTML, source-backed guide fields, legal draft status, and the unexecuted external AEO benchmark are documented.
- Staging smoke and rollback preparation: `READY_FOR_REVIEW` — staging checklist and non-destructive hosting/database rollback plan are documented; no staging or production action was executed.
- Cloudflare deployment verifier: `READY_FOR_REVIEW` — reusable HTTPS route verifier and tests are implemented; the invalid Cloudflare `_redirects` 404 rewrite was removed because Pages supports a top-level `404.html` but not 404 rewrites. The existing `filesmartnaija` Pages project is Git-connected to `edwardabiodun-hub/Taxapp` on `main` with `npm run build:public` and `dist-public`. Both stale Bun lockfiles (`bun.lock` and `bun.lockb`) were removed so Cloudflare can use the tested npm `package-lock.json` instead of failing frozen-install checks; a new preview deployment is still required to verify the fix at the edge.
- CI Cloudflare gate: `READY_FOR_REVIEW` — quality gates now run the Cloudflare verifier automatically when the repository variable `CLOUDFLARE_STAGING_URL` is configured; the gate remains skipped until a staging URL exists.
- Cloudflare staging access runbook: `READY_FOR_REVIEW` — documented Git-connected preview setup, Direct Upload alternatives, preview protection, least-privilege access, and the required handoff values.
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
- Public cold-load measurement: passed locally against the production-equivalent public preview; results are recorded separately below and are not a substitute for a throttled real-browser trace.
- React Router compatibility: passed as an assessment; candidate `7.18.5` supports the current React/Node floors, but the migration remains deferred to an isolated compatibility branch.
- Dependency remediation: passed; the glossary validator, Cloudflare verifier, and public-load measurement focused tests pass, and the post-change audit no longer reports `zod`.
- Cloudflare verifier: focused tests passed (3 tests). The previous live/hash deployment evidence correctly failed the real-404 check because the unknown-route probe returned `200`; that deployment predates the corrected `_redirects` behavior and remains unsuitable as passing staging evidence. A new Git-connected preview must be generated and tested.
- Public-load measurement tests: passed (2 tests); local public-preview baseline recorded about 33.3 kB HTML and 628.2 kB same-origin initial assets for each tested route.
- AEO browser attempt: four accessible Google site-restricted searches returned no indexed FileSmart results. This is recorded as no measurable observation, not as proof that the site is inaccessible to search or answer engines; repeat through Search Console or another accessible measurement workflow.
- Review-fact validation: passed; ambiguous rent periods/shared rent, insurance timing, mortgage residence, and minimum-wage employment context withhold numeric estimates without blocking preparation save/export.
- Export provenance: passed; safe exports retain review facts and state that they are estimates/not submitted and remain subject to the relevant authority's requirements.

## Risks and next action

The code is ready for review on the local branch. The next external step is to commit/push this branch so Cloudflare can generate a preview URL, configure `CLOUDFLARE_STAGING_URL`, and validate route precedence, actual 404 HTTP status, redirects, client hydration, and security headers. The current live custom domain and prior hash deployment fail the real-404 check and must not be treated as staging evidence. Keep pricing behind account creation. Legal/privacy and tax content remain subject to professional approval; the current pages still visibly identify themselves as drafts. The pre-review calculation safeguards intentionally do not change tax law, bands, relief caps, deadlines, penalties, or authority-acceptance claims. Populate filing-directory rows only through a reviewed, source-backed process; do not convert the current unverified statuses into claims without evidence. Repeat the AEO benchmark through Search Console or an accessible browser workflow that can capture answer-engine/search observations. The remaining bundle warning is non-blocking and should be re-measured with cold-load traces before any shared-vendor refactor.
