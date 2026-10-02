# FileSmart Comprehensive Audit — 2026-09-29

## Scope and architecture

FileSmart is a Vite/React/TypeScript SPA backed by Supabase Auth, Postgres/RLS, Edge Functions, Realtime, and encrypted local IndexedDB storage. Profile, declaration, activity, and message metadata synchronize to Supabase; uploaded document bytes remain local-only and encrypted. The only server-side outbound integration found is the `send-message-email` Edge Function calling Resend.

Live smoke verification covered the public Welcome page at `https://filesmart-demo.netlify.app/welcome`; it rendered without browser console errors. The available browser session did not expose a viewport override, so the full mobile/tablet/ultrawide matrix could not be executed.

## Severity summary

| Severity | Result |
| --- | --- |
| P0 Critical | 0 confirmed |
| P1 High | 2 remediated locally; 1 remains open pending legal ownership/jurisdiction inputs |
| P2 Medium | 5 open recommendations/operational gaps |
| P3 Low | 1 test-environment limitation |

## P1 findings and remediation

### P1 — Privacy disclosure contradicted the data flow — REMEDIATED LOCALLY

Evidence: the previous onboarding notice at `src/pages/Onboarding.tsx` stated profile data was stored only on-device, while `src/lib/api.ts:57-81` reads and upserts profiles to Supabase. This could cause users to consent based on materially inaccurate processing information.

Fix applied: onboarding now states that account/profile information is stored in the FileSmart account for cross-device use, while uploaded document files remain encrypted on-device. Regression coverage is in `src/pages/Onboarding.test.tsx`.

### P1 — Missing browser security headers and CSP — REMEDIATED LOCALLY

Evidence: no `public/_headers` or equivalent Netlify header configuration existed. A static SPA handling PII had no declared CSP, clickjacking protection, MIME-sniffing protection, or permissions policy.

Fix applied: `public/_headers` adds CSP, `X-Content-Type-Options`, `X-Frame-Options`, HSTS, `Referrer-Policy`, and `Permissions-Policy`. `public/_redirects` now preserves the SPA fallback in every production build. Contract coverage is in `src/security-headers.test.ts`.

Deployment note: these fixes are in the current worktree and are not live until a later frontend deployment.

### P1 — Required legal coverage is absent — OPEN / BLOCKED ON LEGAL INPUT

Evidence: `src/App.tsx:83-112` contains no Terms or Privacy routes, and the only consent text was the onboarding panel. No authoritative UGC terms, binding arbitration language, controller/operator identity, retention schedule, data-subject process, subprocessors, or contact/legal jurisdiction were found.

This should not be fabricated by an engineer. A production legal owner must supply the operator legal entity, jurisdiction, arbitration seat/institution, contact address, retention policy, and approved wording. Until then, the product should not claim full legal/compliance remediation.

### P2 — Auth gateway CORS policy depended on unchecked deployment origin — REMEDIATED LOCALLY

Evidence: `supabase/functions/auth-gateway/index.ts` accepted `APP_ORIGIN` without validating that it was a canonical HTTPS origin, while the handler returned CORS headers for an exact match. The request-origin comparison itself did not reflect arbitrary origins, but a malformed or attacker-controlled deployment value could become trusted configuration.

Fix applied: the auth gateway now fails closed when `APP_ORIGIN` is absent, validates canonical HTTPS origins, rejects `null` and local origins in production, rejects unsupported preflight methods/headers, and adds `Cache-Control: no-store` to auth and preflight responses. Regression coverage is in `src/lib/auth-gateway.test.ts`.

## P2 findings

### Database performance — missing activity user index

The server query in `src/lib/api.ts:194-203` filters `activities` by `user_id`, but the schema only creates `activities_declaration_id_idx`. A read-only production `EXPLAIN` returned a sequential scan for that query. Declarations and messages used their user/recipient indexes. Add a migration for `activities(user_id)` before activity volume grows.

### SEO and metadata incomplete

`index.html:6-17` uses the generic description `Lovable Generated Project`, a Lovable Open Graph image, and `@Lovable` Twitter metadata. There is no canonical link, sitemap, manifest, or explicit social preview asset. `public/robots.txt` allows crawling but does not reference a sitemap. This is a discoverability and content-quality issue, not an access-control issue.

### Runtime logging cleanup

`src/pages/NotFound.tsx:8` logs expected 404 navigation at error level and `src/lib/sync-service.ts:134-137` logs success/failure directly to the browser console. Replace expected operational logging with a structured, environment-gated logger before treating production console health as clean.

### Dependency supply chain debt

`npm audit --omit=dev --audit-level=high` reported 24 advisories, including 9 high-severity entries. The high entries are primarily build-time PostCSS/Tailwind/glob chains; `recharts` brings in an unpatched lodash advisory. No direct exploit path from user input to the affected lodash functions was established, so this is P2 supply-chain debt rather than P1 application compromise. Re-evaluate the chart dependency and update the build chain on a controlled branch.

### Backup/restore evidence unavailable

The repository contains no backup policy, restore script, or isolated staging target. The live Supabase project was confirmed `ACTIVE_HEALTHY`, but a restore dry-run was not executed because that requires an isolated environment and backup-management authorization. This remains an operational control gap, not a safe action to improvise against production.

## Not applicable or verified secure

- Payment flow: no Stripe, PayPal, Paystack, Flutterwave, checkout, billing, or payment webhook implementation exists in the repository. There is no production transaction path to test.
- Payment webhooks: the only inbound webhook is `send-message-email`; it checks `x-webhook-secret` before parsing, re-reads the message row server-side, and uses an idempotency ledger.
- Access control/IDOR: Supabase queries scope user-owned rows and RLS policies enforce ownership; message writes are column-restricted and declaration/message ownership is trigger-enforced.
- XSS: no application-controlled `dangerouslySetInnerHTML` or raw HTML sink was found; the chart component's static SVG style injection contains no user data. React output remains escaped.
- File storage: no server upload endpoint or Supabase Storage bucket is used. Document bytes stay in encrypted local IndexedDB. A shared validator now rejects mismatched MIME/extension pairs, executable extensions, and files over 10 MB at both upload entry points.
- Rate limiting: auth-gateway operations use dual account/IP counters backed by a private schema RPC. The true client-IP trust boundary should be confirmed against the deployed Supabase gateway configuration during an infrastructure review.
- Edge/fallback UI: branded 404, loading, empty-message, and safe user-facing error states exist.

## Verification evidence

- Focused remediation tests: 11 passed
- Full serialized suite: 50 files / 228 tests passed
- TypeScript: `npx tsc --noEmit` passed
- Production build: passed; `dist/_headers` and `dist/_redirects` present
- Targeted lint: no new findings; one pre-existing `no-explicit-any` error remains in `src/pages/SubmissionDetail.tsx:439` and one Fast Refresh warning remains in `src/pages/Onboarding.tsx:54`
- Live Welcome smoke: HTTP/UI rendered with no console errors observed
