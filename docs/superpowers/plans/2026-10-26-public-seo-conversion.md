# Public SEO Rendering and Pricing Conversion Plan

## Authorized scope

Implement on `codex/public-seo-conversion`, based on `taxapp/main` (`8ff36e7551f0164cdcc3e47dcf1771ee4cbf4e90`):

- FS-03: serve rendered initial HTML for approved public pages; preserve authenticated route boundaries; provide an actual 404 for unknown routes.
- FS-05: route-specific title, description, canonical and social metadata; consistent sitemap and robots rules; appropriate structured data only where supported by page content.
- FS-07: pricing discovery/conversion route correction. Visitors may reach pricing from navigation, but its existing account gate remains enforced.

No production deployment, production database changes, tax-rule edits, legal copy edits, or credential/config changes are authorized.

## Existing behavior verified in the repository

- Public pages are a Vite/React SPA launched from `public.html` and `src/public-main.tsx`.
- `PublicApp.tsx` defines the public routes, currently waits for auth initialization before rendering any route, redirects unknown paths to `/`, and protects `/pricing` behind account creation.
- `PublicNav.tsx` sends the Pricing link to the filing waitlist in public launch mode, despite `/pricing` being available as an account-gated route.
- SEO metadata is currently set in client effects (`src/lib/seo.ts`); route-specific values are absent from initial HTML.
- `public/_redirects` rewrites every URL to `/index.html`, including unknown paths.
- `public/robots.txt` disallows `/calculator`; `public/sitemap.xml` omits the public calculator.
- Existing tests include `PublicNav.test.tsx`, SEO helpers, and page/component tests. No current SSR/prerender pipeline exists.

## Proposed architecture

Use the existing React/Vite stack and public entry. Add a build-time prerender step for a finite manifest of publicly indexable routes, rendering the existing React page components (not a separately maintained content copy) into route HTML. Reuse one route metadata/content manifest for prerender metadata, sitemap generation, and route coverage checks. Keep auth-required pages out of the manifest. `/pricing` remains account-gated and excluded from public output. Keep existing app routes on the client shell where appropriate, while unmatched paths receive a static 404 document/status through host-compatible routing configuration.

The calculator may be included as a public route because the product explicitly allows public estimates; do not serialize user-entered values or estimates into generated files. Do not invent FAQ claims or structured data. Add only Organization/WebSite or Article structured data where the existing verified public page data supports it.

## Work batches

### Batch A — Baseline and acceptance coverage

- Record baseline build/test results without secrets.
- Add tests for public route rendering, per-route metadata/canonical, sitemap/robots alignment, unknown path handling, and pricing navigation/account gate.
- Acceptance: tests fail against current behavior and describe only approved scope.

### Batch B — Pricing conversion path

- Make Pricing navigation resolve to `/pricing` in the public site.
- Preserve `PublicApp` authentication redirect to `/create-account` and return-to-pricing behavior.
- Acceptance: desktop/mobile navigation advertises pricing; unauthenticated pricing still gates to account creation.

### Batch C — Public prerender and route handling

- Add the smallest build-time renderer using existing React route components and router context.
- Ensure public pages render meaningful content before client JavaScript.
- Keep client hydration consistent and authenticated/private routes excluded.
- Provide a real not-found response/page rather than redirecting unknown URLs to home.
- Acceptance: built HTML contains route-specific body and metadata; unknown route responds 404 on the supported local preview/server; app routes continue to resolve as intended.

### Batch D — Metadata, sitemap, structured data

- Centralize metadata for the finite public route set and update rendered document head per route.
- Generate sitemap from that route source and include `/calculator`; remove its robots disallow rule.
- Keep private routes absent from sitemap and disallowed where appropriate; robots is not treated as access control.
- Acceptance: metadata/canonical match each path; sitemap entries match the public manifest; private routes are absent; structured data validates syntactically and makes no unsupported claims.

### Batch E — Validation and handoff

- Run focused tests, full test suite, lint, production/public builds, and static route checks.
- Review diffs for accidental tax, legal, secrets, or environment changes.
- Document deployment-host behavior and any staging-only limitation; do not deploy.

## Dependency graph

Baseline/tests → Batch B and Batch C in parallel (disjoint source files) → Batch D (depends on route manifest/rendering) → Batch E.

## Risks and controls

- Server rendering can execute module-level browser/backend initialization. Mitigate by keeping SSR imports route-scoped, using non-sensitive build placeholders only if unavoidable, and never copying `.env`.
- Hydration mismatch can cause layout/content replacement. Test generated HTML and hydrate representative routes.
- Static hosting can turn an HTML 404 into HTTP 200 if catch-all rewrites remain. Validate host behavior and use explicit route/fallback rules supported by the current Cloudflare Pages target.
- Tax content/legal pages have unresolved professional-review concerns. This scope does not edit their wording or represent them as approved.
- Account and pricing details remain gated; no pricing values are made public.

## Definition of done

- Approved public routes have useful initial HTML and correct metadata/canonicals.
- Public calculator is indexable and included in sitemap; sensitive routes remain excluded.
- Pricing nav reaches the gated pricing route; unauthenticated users are sent to account creation.
- Unknown routes are not silently redirected to the homepage.
- Automated checks/build pass, no secrets or generated artifacts are committed, and production remains unchanged.

## Execution status — 2026-10-26

- Batch A: COMPLETE. Route-manifest, document-head, navigation, auth/loading, and not-found tests added.
- Batch B: COMPLETE. Public Pricing navigation points to `/pricing`; unauthenticated users still go to account creation; File taxes remains waitlist-gated.
- Batch C: COMPLETE. The public build prerenders the existing React route components, hydrates them client-side, emits a branded 404, and maps only known application routes to the app shell.
- Batch D: COMPLETE. Metadata/canonical/OG/Twitter tags and WebPage JSON-LD are generated from the public route manifest. Sitemap is generated from that manifest; the calculator is crawlable and included. Pricing and account/app paths are excluded.
- Batch E: COMPLETE locally. Full test suite: 111 files / 819 tests passed. Public build and standard app build passed. Lint has 0 errors and 14 existing warnings. TypeScript app check passed. Static output inspection verified all 13 pages have an H1 and canonical, sitemap count is 13, calculator is allowed, pricing is not prerendered, and 404 is noindex.
- Production/deployment validation: NOT AUTHORIZED and not performed. The Cloudflare Pages origin-level status behavior still needs staging/host verification before deployment.
- Tax/legal work packages: OUT OF SCOPE. Existing professional review and legal approval blockers remain.
