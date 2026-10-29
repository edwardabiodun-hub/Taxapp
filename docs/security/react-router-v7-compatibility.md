# React Router 7 compatibility spike

**Date:** 2026-10-27
**Current dependency:** `react-router-dom@6.30.6`
**Candidate checked:** `react-router-dom@7.18.5`

**Metadata rechecked:** October 28, 2026 — npm reports Node `>=20.0.0` and React/React DOM `>=18` peer requirements. The active repository remains on `react-router-dom@6.30.6`.

## Findings

- The candidate supports the current React 18 and React DOM 18 peer dependencies.
- The candidate requires Node 20 or newer; the repository CI already uses Node 22.
- The application uses the v6 declarative routing surface extensively: `BrowserRouter`, `MemoryRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `NavLink`, `useLocation`, `useNavigate`, and `useParams`.
- The public prerenderer imports `StaticRouter` from `react-router-dom/server.mjs`, so server-side rendering must be tested separately from browser routing.
- Route behavior is conditional on authentication, profile restoration, password recovery, and the launch-phase filing gate. A version upgrade must preserve those route tables and redirects.
- Existing dependency-floor tests intentionally assert the patched v6 line and must be replaced with a v7 compatibility assertion only after the migration is accepted.

## Safe migration sequence

1. Create a dedicated compatibility branch; do not combine this with tax, legal, or deployment changes.
2. Upgrade `react-router-dom` and lockfile together.
3. Run the full test suite serially, including authenticated route tests and public prerender tests.
4. Validate every redirect and protected-route state with signed-out, signed-in, no-profile, password-recovery, and launch-phase fixtures.
5. Build both authenticated and public outputs, then verify direct navigation and refresh behavior.
6. Run the Cloudflare staging verifier before considering the upgrade releasable.
7. Review the advisory fixes and any future-flag behavior before merging.

## Decision

Do not upgrade in the current mixed-change branch. The compatibility spike is complete enough to define the migration boundary, but the major upgrade remains a separate engineering change requiring regression evidence.

## Isolated spike execution — October 28, 2026

The upgrade was tested on branch `codex/react-router-v7-spike` at commit `ce49098` without changing this production-oriented branch.

- `react-router-dom` and `react-router` were upgraded together to `7.18.5` with the lockfile updated.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- `npm test -- --run`: passed, 118 test files and 860 tests.
- `npm run build`: passed with exit code 0; the authenticated bundle produced the existing large exporter/vendor chunks, with no new build error.
- `npm run build:public`: failed during the prerender stage. The current `scripts/prerender-public.mjs` imports `react-router-dom/server.mjs`, a subpath that is not exported by v7.18.5. Compatibility experiments using the v7 root export also exposed Vite 5 SSR CommonJS/ESM resolution and router-context duplication problems.
- `npm run verify:public`: failed because the failed prerender left only the shell `index.html`; the expected route files and `404.html` were not generated.
- `npm run lint`: passed with the repository's existing 14 warnings and zero errors.

This is a migration blocker, not a production defect in the current v6 line. A future v7 migration needs a deliberate SSR compatibility change (likely a Vite/SSR entrypoint adjustment), then must rerun public prerender, direct-route, Cloudflare preview, and authenticated-route validation before review or merge.

## Advisory recheck — October 28, 2026

`npm audit --omit=dev --audit-level=high` still reports the same two moderate React Router advisories against the installed `react-router-dom@6.30.6` line. The audit tool offers only `npm audit fix --force`, which would install the breaking `react-router-dom@7.18.5` release. No patched 6.x remediation was identified by the package audit, and no upgrade was applied.

The recommendation remains to keep the current v6 dependency pinned in this branch and schedule the v7 work as an isolated migration. The migration is not production-ready until the public prerenderer no longer depends on the incompatible `react-router-dom/server.mjs` boundary and the full authenticated/public/Cloudflare route matrix passes.

## Review checkpoint — October 29, 2026

The merged production branch remains on `react-router-dom@6.30.6`. The current main commit is `59e10c1` (PR #33 documentation reconciliation); no router upgrade was included in that merge. A fresh `npm audit --omit=dev --audit-level=high` still reports the same two moderate advisories, with only the breaking v7 remediation offered by npm.

The v7 work is therefore an open security-remediation planning item, not an approved production change. The safe next deliverable is an isolated SSR adapter prototype and migration test matrix. Do not run `npm audit fix --force` against the production branch.

## Proposed implementation plan — not applied

### Phase A — SSR boundary prototype

- Create a fresh branch from the current approved base.
- Replace the prerenderer's v6-only server import through the smallest supported v7 SSR entrypoint or a dedicated server-renderer adapter.
- Keep browser route declarations unchanged during this phase.
- Acceptance: `npm run build:public` produces all expected public route files and `404.html` without duplicate-router or CommonJS/ESM errors.

### Phase B — Route-behavior regression matrix

- Run the existing route tests with fixtures for signed-out, signed-in, no-profile, password-recovery, and launch-gated filing states.
- Add explicit direct-navigation and refresh tests for public routes, `/pricing`, `/filing-waitlist`, and protected application routes.
- Verify `Navigate`, `NavLink`, `Outlet`, `useLocation`, `useNavigate`, and `useParams` behavior where each is currently used.
- Acceptance: no redirect, authentication, or launch-gate behavior changes; the serialized suite passes without weakening existing assertions.

### Phase C — Edge and production-equivalent validation

- Run the authenticated build and public build.
- Run the public-output verifier, Cloudflare route verifier, real 404 probe, sitemap/canonical checks, and accessibility smoke checks.
- Deploy only to the non-production Cloudflare preview for this migration branch.
- Acceptance: preview routes return expected canonical redirects and 200/404 responses; no production custom-domain change occurs.

### Phase D — Security and release decision

- Re-run `npm audit --omit=dev --audit-level=high` and review the exact advisory coverage.
- Review v7 future flags and any changed SSR serialization behavior.
- Obtain code review focused on redirect safety, SSR hydration, private-route boundaries, and public prerendering.
- Acceptance: all gates pass, the two advisory paths are covered by the upgraded dependency, and a separate approval authorizes merging.

### Explicit non-goals

- No tax calculation changes.
- No legal or content changes.
- No database migration or secret changes.
- No production deployment.
- No `npm audit fix --force` on the current branch.
