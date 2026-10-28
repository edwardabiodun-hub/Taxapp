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
