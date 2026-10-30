# React Router v7 migration matrix

**Prepared:** October 30, 2026  
**Current production line:** `react-router-dom@6.30.6`  
**Candidate:** `react-router-dom@7.18.5`  
**Status:** Planning only; no production dependency or prerenderer change

## Decision

Keep the v6 line in production. The isolated v7 spike passed TypeScript and focused adapter tests, but the current Vite 5 public prerender boundary does not resolve the existing `react-router-dom/server.mjs` import cleanly under v7. A migration must prove the SSR boundary and preserve launch gating before it can be considered for review.

## Route and state matrix

| Surface | Representative routes | Required fixtures | Required v7 checks | Release gate |
|---|---|---|---|---|
| Public education and legal | `/`, `/learn`, `/learn/:slug`, `/how-it-works`, `/about`, `/contact`, `/privacy`, `/terms`, `/disclaimer` | Signed out, direct navigation, hard refresh | `Routes`, `Route`, `NavLink`, canonical page output, initial HTML | All pages prerender with correct H1/canonical and no hydration mismatch |
| Public conversion | `/calculator`, `/filing-directory`, `/filing-waitlist` | Signed out, launch phase enabled, invalid form input | Redirects, form state, noindex waitlist behavior, calculator result rendering | Calculator remains estimate-only; waitlist remains outside sitemap and accepts only valid consent |
| Account entry | `/create-account`, `/login`, `/check-email`, `/forgot-password`, `/reset-password` | Signed out, pending email, password recovery | Lazy boundaries, `Navigate`, direct refresh, recovery query handling | No protected content leaks and all intended redirects remain unchanged |
| Onboarding and launch gate | `/onboarding`, `/declare` | No profile, profile restored, filing launch gate on/off | Auth restoration, launch-gated redirect, browser refresh | Filing remains gated during launch; no accidental submission route exposure |
| Authenticated application | `/`, `/submissions`, `/submissions/:id`, `/messages`, `/calculator`, `/profile` | Signed in, signed out, missing record, invalid submission id | `Outlet`, nested layout, protected fallback, `useParams`, direct navigation | Auth and ownership boundaries remain unchanged |
| Error handling | Unknown path, broken route boundary, malformed slug | Signed out and signed in | Catch-all route and branded error boundary | Unknown paths return the intended branded 404 in public output and Cloudflare preview |

## Migration sequence

1. Create a dedicated branch from the current `taxapp/main` commit; do not branch from a mixed-change checkout.
2. Upgrade `react-router` and `react-router-dom` together and review the lockfile diff.
3. Load the actual v7 server module through the Vite SSR runtime; do not assume the prototype adapter proves compatibility.
4. Wire the adapter only into a migration-only prerender command, keeping the v6 command available for rollback.
5. Run TypeScript, lint, the serialized full suite, public prerender, public-output verification, and accessibility/route tests.
6. Validate the route/state matrix above on a non-production Cloudflare preview, including real 404 behavior, CSP, sitemap, waitlist gating, hydration, and browser-console output.
7. Run `npm audit --omit=dev --audit-level=high` and record which advisories are actually addressed.
8. Request focused review of SSR, auth redirects, launch gating, and public/private route boundaries.

## Rollback

Rollback means reverting the migration branch or deployment to the last v6 commit. Do not remove the current v6 prerender command until the v7 preview passes every gate. No database migration, tax-rule change, secret change, or production deployment is part of this plan.

## Acceptance criteria

- `npm run build:public` generates every expected public route and `404.html`.
- `npm run verify:public` passes with sitemap parity, canonical coverage, H1 coverage, and branded 404 output.
- The full serialized test suite passes without weakened assertions.
- Authenticated and launch-gated routes preserve existing redirects and data isolation.
- Cloudflare preview route, CSP, console, waitlist, sitemap, and real 404 checks pass.
- No production custom-domain or tax-calculation change is made by the migration PR.
