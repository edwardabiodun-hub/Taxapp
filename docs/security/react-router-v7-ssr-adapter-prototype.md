# React Router v7 SSR adapter prototype

**Date:** 2026-10-29
**Base:** `taxapp/main` at `72b3455`
**Status:** Isolated prototype; not wired to production

## Purpose

The current application remains on `react-router-dom@6.30.6`. The previous v7 spike showed that the existing prerenderer import:

```js
import { StaticRouter } from "react-router-dom/server.mjs";
```

does not resolve under `react-router-dom@7.18.5`, and that changing the import directly can expose Vite 5 SSR CommonJS/ESM and duplicate-router-context problems. This prototype isolates the export-resolution boundary so those concerns can be tested before changing the production dependency or prerender flow.

## Prototype boundary

- Adapter: `scripts/router-v7-ssr-adapter-prototype.ts`
- Tests: `scripts/router-v7-ssr-adapter-prototype.test.ts`
- It accepts a named `StaticRouter` export and a namespace-shaped default export.
- It fails closed when the server module does not expose a callable `StaticRouter`.
- It creates the same `StaticRouter` element shape that the current prerenderer needs: a location plus the existing route tree.
- It is intentionally not imported by `scripts/prerender-public.mjs` and does not alter browser routing, the package lockfile, or the production build.

## Validation

The focused prototype suite passes four tests. The test was first run before the adapter existed and failed at module resolution, then passed after the minimal adapter was added.

```text
npx vitest run scripts/router-v7-ssr-adapter-prototype.test.ts
Test Files  1 passed
Tests       4 passed
```

## Next migration gate

This prototype is not evidence that the v7 migration is release-ready. Before wiring it into the prerenderer, a dedicated migration branch must:

1. Install `react-router-dom@7` and `react-router@7` together in a lockfile-only change set.
2. Load the actual v7 server module through the Vite SSR runtime and prove that the adapter resolves it without duplicate React Router contexts.
3. Wire the adapter into a migration-only copy of the prerender command, leaving the current command available for rollback.
4. Run public prerender, route-output verification, hydration, authenticated-route, launch-gate, direct-navigation, and Cloudflare preview checks.
5. Re-run `npm audit --omit=dev --audit-level=high` and review the exact advisory coverage.

Until all gates pass, keep the current v6 dependency and production prerenderer unchanged. Do not run `npm audit fix --force` on the production branch.
