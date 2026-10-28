# FileSmart Current-State Architecture Report

Date: 2026-10-27
Scope: repository evidence only; no production mutation or live tax-rule approval.

## Evidence classification

| Area | Finding | Evidence | Classification |
| --- | --- | --- | --- |
| Frontend | Vite + React + TypeScript application with separate public and authenticated entry points | `package.json`, `src/public-main.tsx`, `src/main.tsx` | VERIFIED_IN_REPOSITORY |
| Routing | Public routes use React Router; authenticated routes remain behind the app router and auth boundary | `src/PublicApp.tsx`, `src/App.tsx` | VERIFIED_IN_REPOSITORY |
| Public rendering | Public build prerenders a finite route manifest and emits a branded 404 | `scripts/build-public.mjs`, `scripts/prerender-public.mjs`, `src/lib/public-routes.ts` | VERIFIED_IN_REPOSITORY |
| SEO | Route metadata, canonicals, social tags, robots, and sitemap are generated from the public route set | `src/lib/public-document.ts`, `public/robots.txt`, `public/sitemap.xml` | VERIFIED_IN_REPOSITORY |
| Tax calculations | 2026 calculator uses the shared Nigeria Tax Act 2025 profile and withholds estimates for unsupported classifications | `src/lib/tax-calculator.ts`, `src/data/pit-baseline.ts` | VERIFIED_IN_REPOSITORY |
| Jurisdictions | All states and FCT are represented by a conservative generic-preparation capability registry; direct filing is not claimed | `src/data/jurisdiction-registry.ts`, `src/domain/jurisdictions.ts` | VERIFIED_IN_REPOSITORY |
| Deadlines | Deadline resolution carries source, verification, confidence, timezone, fallback, stale, and offline states | `src/lib/deadline-service.ts`, `src/components/deadlines/DeadlineCard.tsx` | VERIFIED_IN_REPOSITORY |
| Exports | PDF, CSV, and XLSX universal exports are separated from authority submission status | `src/lib/exports/`, `src/lib/submission-adapters/` | VERIFIED_IN_REPOSITORY |
| Filing gate | Public website filing CTA is waitlist-gated; public calculator remains available and does not submit | `src/lib/launch-phase.ts`, `src/pages/TaxCalculator.tsx` | VERIFIED_IN_REPOSITORY |
| Analytics | Provider-backed analytics is intentionally not enabled; the repository now has a browser-local allowlisted event contract, while consent, retention, provider, and dashboard decisions remain open | `src/lib/analytics.ts`, `src/lib/analytics.test.ts` | VERIFIED_IN_REPOSITORY |
| Production routing | Cloudflare Pages status behavior, deployed 404 status, redirects, and hydration have not been verified from this branch | implementation record | UNVERIFIED_HYPOTHESIS |
| CI quality gates | Pull requests and main-branch pushes now run typecheck, lint, tests, both builds, and generated-output hygiene checks | `.github/workflows/quality-gates.yml` | VERIFIED_IN_REPOSITORY |
| AEO measurement | A 40-question benchmark template exists, but no external engine observations or visibility claims have been recorded | `docs/seo/aeo-benchmark.md` | VERIFIED_IN_REPOSITORY |
| Filing evidence boundary | Directory entries remain unverified; future verified claims now require matching official `.gov.ng` evidence and reviewer metadata | `src/domain/filing-directory.ts`, `src/domain/filing-directory.test.ts` | VERIFIED_IN_REPOSITORY |
| Local security audit | No committed secret or frontend service-role exposure was found; React Router advisories remain for a separately reviewed major upgrade, while the unnecessary `zod` and `xlsx` production dependencies were removed | `package.json`, `package-lock.json`, export/glossary/router consumers | VERIFIED_IN_REPOSITORY |
| Legal/privacy | Operator identity, contacts, retention, UGC, arbitration, and final privacy/legal wording require owner and professional review | existing legal-review record and public legal pages | BLOCKED_EXTERNAL_REVIEW |

## Architecture summary

```text
Public browser request
  -> Cloudflare Pages/static output
  -> prerendered public route HTML
  -> React hydration through src/public-main.tsx
  -> public route manifest and document metadata

Authenticated app request
  -> src/main.tsx / App.tsx
  -> AuthContext and protected route boundary
  -> local-first preparation repository
  -> optional Supabase synchronization

Tax estimate
  -> shared 2026 PIT rule profile
  -> deterministic calculator
  -> explicit unsupported-case refusal
  -> result shown as estimate only

Jurisdiction context
  -> conservative registry
  -> deadline service with evidence/fallback
  -> universal export or guided handoff
  -> no direct authority submission without validated adapter evidence
```

## Confirmed open work

1. Define consent, retention, provider, and dashboard controls before enabling analytics transmission.
2. FS-06 route decision: retain `/calculator` as the single canonical public estimator route. It already provides the 2026 annual estimate and does not submit a return; do not add a duplicate `/tools/paye-calculator` alias or change formulas without professional review.
3. Use the source-verification workflow to populate the filing directory only after official state evidence is reviewed.
4. Run the AEO benchmark with captured observations; do not convert `NOT_RUN` rows into visibility claims without evidence.
5. Validate the generated output on a Cloudflare staging target before production deployment.
6. Review and remediate the remaining React Router advisory set without using a breaking `npm audit fix --force`; the `zod` and `xlsx` production dependencies have been removed. React Router requires a separate v7 compatibility review.

## Explicitly blocked or deferred

- Tax-rule changes or new legal interpretations require qualified professional review.
- Production database migrations, Edge Function secrets, scheduler configuration, and deployment are outside this local implementation.
- Direct filing/API adapters require authority evidence, sandbox validation, privacy review, idempotency tests, and named approval.
- Unverified pricing, testimonials, security certifications, and authority acceptance claims must not be published.
