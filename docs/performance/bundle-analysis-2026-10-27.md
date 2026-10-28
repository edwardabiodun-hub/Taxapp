# Bundle-performance analysis — 2026-10-27

## Scope and command

This is a local production-build analysis. It does not represent a Lighthouse score or a network trace from production.

```text
npm run build
```

The build completed successfully with Vite 5.4.21. The largest emitted JavaScript assets were:

| Asset | Raw size | Gzip size | Loading assessment |
|---|---:|---:|---|
| `xlsx` | 429.02 kB | 143.08 kB | Export-only; already loaded through a dynamic import. |
| application entry | 399.65 kB | 123.64 kB | Main application graph; requires deeper route-level profiling before splitting. |
| `jspdf` | 390.66 kB | 128.88 kB | Export-only; already loaded through a dynamic import. |
| Supabase vendor | 227.12 kB | 58.98 kB | Shared authentication/data client; not safe to defer without auth-flow review. |
| `html2canvas` | 201.42 kB | 48.03 kB | Not part of the initial modulepreload list; retain deferred loading. |
| React vendor | 142.35 kB | 45.63 kB | Core runtime; not a safe lazy-loading candidate. |
| motion vendor | 128.88 kB | 42.37 kB | Shared UI dependency; candidate for later route-specific review only. |

## Findings

1. PDF and XLSX generation are already deferred in `src/lib/exports/pdf-exporter.ts` and `src/lib/exports/xlsx-exporter.ts`. The initial `dist/index.html` modulepreloads the React, Supabase, Radix, icon, router, and motion vendors, but not the PDF/XLSX exporter chunks.
2. Public and authenticated pages are already route-lazy through `React.lazy` in `src/PublicApp.tsx` and `src/App.tsx`.
3. No safe additional lazy-loading change was justified from this static analysis alone. Splitting the entry graph or deferring Supabase would require browser-level performance measurements and authentication regression tests.
4. The size warning remains an optimization backlog item, not a failed build. The right next measurement is a production-like cold-load trace for `/`, `/calculator`, and `/filing-waitlist` with cache disabled and mobile throttling.

## Safe next actions

- Add route-specific cold-load measurements before changing shared vendor boundaries.
- A local public-preview measurement recorded approximately 33.3 kB of HTML and 628.2 kB of same-origin initial assets for each of `/`, `/calculator`, and `/filing-waitlist` under an uncached Node fetch. This is a network-footprint baseline, not a mobile-throttled browser trace.
- Keep PDF/XLSX imports dynamic and add a regression check if export code is refactored.
- Consider replacing or isolating the unused legacy `src/lib/filing-summary-pdf.ts` path only after confirming no runtime consumer; do not delete it as part of this audit.
- Revisit `xlsx` and `jspdf` only after export requirements and browser support are confirmed; they are not initial-load blockers today.

## Cloudflare preview measurement — 2026-10-28

The route measurement script was updated to follow same-origin canonical redirects before reading HTML and assets. A live measurement against the stable branch preview `https://codex-public-seo-conversion.filesmartnaija.pages.dev` recorded:

| Route | Final status | HTML bytes | Same-origin asset bytes |
|---|---:|---:|---:|
| `/` | 200 | 33,322 | 628,230 |
| `/calculator` | 200 after `308 → /calculator/` | 35,737 | 628,230 |
| `/filing-waitlist` | 200 after canonical redirect | 33,322 | 628,230 |

The public graph is still dominated by shared React, Supabase, Radix, icon and CSS assets. No additional lazy-loading change is justified without a real browser trace showing route-level execution and interaction costs. The next safe optimization remains a mobile-throttled browser trace, followed by an isolated change to shared vendor boundaries if the trace identifies a measurable bottleneck.

## Throttled browser trace — 2026-10-28

A cold-load browser trace was captured against the stable Cloudflare branch preview with cache disabled, a 390×844 mobile viewport, a 1440×900 desktop viewport, and a Fast 3G approximation (150 ms latency, 1.6 Mbps download, 750 Kbps upload). Each route used a fresh browser context. Trace archives and the machine-readable report are stored locally under `.gstack/benchmark-reports/`.

| Viewport | Route | FCP | Load event | Requests | Transfer | Largest resource |
|---|---|---:|---:|---:|---:|---|
| Mobile | `/` | 1.52 s | 10.65 s | 10 | 2.08 MB | `filesmart-hero-tax-preparation.png` — 1.87 MB |
| Mobile | `/calculator/` | 1.06 s | 1.43 s | 9 | 209 KB | Supabase vendor — 58.7 KB |
| Desktop | `/` | 1.20 s | 10.62 s | 10 | 2.08 MB | `filesmart-hero-tax-preparation.png` — 1.87 MB |
| Desktop | `/calculator/` | 1.03 s | 1.45 s | 9 | 209 KB | Supabase vendor — 58.6 KB |

### Interpretation

1. The main performance issue is the homepage hero image, not the JavaScript bundle. The 1.87 MB image accounts for roughly 90% of the homepage transfer and drives the 10.6-second load event under the tested network profile.
2. The calculator route has a materially smaller cold-load footprint and does not show a large route-specific JavaScript regression.
3. The safe next optimization is image-specific: generate a responsive, compressed WebP/AVIF hero variant with explicit dimensions and a conservative fallback. Do not split shared Supabase or React vendors based on this trace alone.
4. The trace is a repeatable baseline, not a Lighthouse field score. Repeat after image optimization and compare FCP, load event, transfer bytes, and largest-resource duration.

## Responsive hero image validation — 2026-10-28

The homepage hero was converted to AVIF/WebP with the original PNG retained as the fallback. The production bundle was measured locally with the same Fast 3G approximation, cache disabled, fresh browser contexts, and mobile/desktop viewports. This is a lab comparison against the earlier Cloudflare preview trace; local-server timings should not be treated as field data.

| Viewport | Route | FCP | Load event | Requests | Transfer | Largest image |
|---|---|---:|---:|---:|---:|---|
| Mobile | `/` | 1.18 s | 1.55 s | 10 | 260 KB | AVIF — 50.9 KB |
| Mobile | `/calculator/` | 0.86 s | 1.29 s | 9 | 209 KB | FileSmart lockup — 12.8 KB |
| Desktop | `/` | 0.95 s | 1.55 s | 10 | 260 KB | AVIF — 50.9 KB |
| Desktop | `/calculator/` | 0.86 s | 1.30 s | 9 | 209 KB | FileSmart lockup — 12.8 KB |

The homepage transfer is approximately 88% smaller than the earlier 2.08 MB trace, and the hero image is approximately 97% smaller than the original 1.87 MB PNG. The calculator footprint is effectively unchanged. The new trace archives and machine-readable report are stored locally under `.gstack/benchmark-reports/`.

## Current Cloudflare preview verification — 2026-10-28

The post-optimization build was rechecked against `https://codex-public-seo-conversion.filesmartnaija.pages.dev` using the repository route verifier and public-load measurement script. Representative routes returned `200` after expected same-origin `308` trailing-slash redirects, and an unknown-route probe returned a real `404` response. The uncached Node baseline recorded approximately 33.6–35.7 kB of HTML and 628.3 kB of same-origin initial assets per tested route.

This confirms edge routing and the network footprint only. It is not a throttled browser trace. The existing throttled trace above is the pre-hero-optimization Cloudflare baseline; the post-optimization throttled measurements below were captured locally and should be repeated against this deployed preview before making further shared-vendor changes.

## Public-auth vendor deferral — 2026-10-28

The public entry previously module-preloaded the Supabase vendor even on marketing and education routes. `AuthProvider` and the public support assistant now load `src/lib/supabase-client.ts` dynamically, preserving the existing session, sign-out, support-chat, and error behavior while removing the client from the public entry's preload set.

| Measurement | Before | After | Change |
|---|---:|---:|---:|
| Public module-preloaded Supabase vendor | 226.68 kB raw | 0 kB | removed from initial preload |
| Local public same-origin initial assets | baseline unavailable in this checkout | 401.8 kB raw | new post-change baseline |

The local preview measurement covered `/`, `/calculator`, and `/filing-waitlist`; each served 33.5 kB of HTML and 401.8 kB of same-origin initial assets. Public output verification passed with 14 prerendered pages, 14 sitemap entries, and `404.html`.

The authenticated production bundle still contains Supabase as a shared static dependency because authenticated services import it directly. Vite reports that the dynamic import cannot create a second authenticated chunk; this is expected and does not affect the public deferral. PDF/XLSX/export chunks remain deferred.

This is a network-footprint measurement, not a Core Web Vitals or mobile-throttled browser trace. The real-browser trace remains open until the browse daemon or another accessible browser performance tool is available.
