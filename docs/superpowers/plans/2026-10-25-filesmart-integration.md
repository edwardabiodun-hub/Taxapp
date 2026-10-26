# FileSmart website and app integration plan

## Outcome

Integrate the reviewed fuller public website into `taxapp/main` without replacing its Supabase authentication, newer app features, or 2026 Nigeria Tax Act calculations. Work on `codex/filesmart-integration-20261025` until verification is complete.

## Steps

1. Bring forward the audited 2026 PIT calculation commits; resolve conflicts against current app code and verify tax-specific tests.
2. Port public navigation, pages, education content, media, SEO assets, waitlist/contact client code, and contact Edge Function from the website checkpoint. Keep app authentication and app routes.
3. Integrate public routes into the existing authentication branches. Pricing remains account gated, and filing links enter the launch waitlist flow. Do not treat the frontend gate as a server security boundary.
4. Preserve account creation and profile consent in onboarding. Port only approved brand and navigation improvements from the checkpoint.
5. Repair integration failures, then run typecheck, lint, tests, and production build. Inspect public routes and app routes locally.
6. Record the final architecture, environment needs, risks, and rollout steps in repo memory and handoff documentation.

## Release gate

Do not merge or deploy while critical checks fail or while launch gating and route behavior remain unverified. Never commit local `.env` files or generated build/cache files.
