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

## Preview deployment verification — 2026-10-28

Commit `59f98db` was deployed to the existing Cloudflare Pages project as the non-production branch preview:

- Preview URL: `https://public-seo-conversion.filesmartnaija.pages.dev`
- Deployment URL: `https://bfa9ebca.filesmartnaija.pages.dev`
- Production custom domain: unchanged

The live route verifier passed for `/`, `/calculator`, `/filing-directory`, `/learn`, `/privacy`, `/terms`, and `/contact`. The canonical route forms returned the expected same-origin `308` trailing-slash redirect followed by `200`, and the unknown-route probe returned a real `404`.

The post-deployment uncached Node measurement recorded 33.5–35.7 kB of HTML and 401.8 kB of same-origin initial assets for `/`, `/calculator`, and `/filing-waitlist`. This is an edge/network-footprint measurement, not a mobile-throttled browser trace.

## Browser measurement — 2026-10-28

The gstack browser was built and used against the preview at a `390×844` viewport. The browser tool does not expose network-condition emulation, so these are real browser timings without Fast 3G throttling:

| Route | Final URL | Response start | DOM interactive | Load event | Notes |
|---|---|---:|---:|---:|---|
| `/` | `/` | 48.2 ms | 60.8 ms | 112.1 ms | Cached reload; transfer size was cache-dominated. |
| `/calculator` | `/calculator/` | 408.4 ms | 421.6 ms | 523.5 ms | Loaded calculator, motion, and Supabase client chunks. |
| `/filing-waitlist` | `/` | 413.7 ms | 423.1 ms | 542.1 ms | Application resolved this path to the homepage; route behavior should be confirmed before using it as a standalone performance target. |

The calculator trace’s largest observed script resources were `vendor-supabase-7KcKRj6y.js` at 58.7 kB transferred, `vendor-motion-Bbn4ZNjF.js` at 42.5 kB, `vendor-react-BNp8CyxV.js` at 46.7 kB, and `TaxCalculator-a9gXcgBL.js` at 12.6 kB. These measurements support the existing public-auth deferral decision but do not justify a further shared-vendor refactor without a throttled trace.

The authenticated production bundle still contains Supabase as a shared static dependency because authenticated services import it directly. Vite reports that the dynamic import cannot create a second authenticated chunk; this is expected and does not affect the public deferral. PDF/XLSX/export chunks remain deferred.

This is a network-footprint measurement, not a Core Web Vitals or mobile-throttled browser trace. The real-browser mobile-viewport measurements above are complete; a true Fast 3G trace remains open because this browser tool does not expose network-condition emulation.

## Independent Lighthouse lab trace — 2026-10-28

The Cloudflare preview was tested with Lighthouse `13.6.0` using a fresh mobile context, cache disabled, a 390×844 viewport, and DevTools throttling configured to 150 ms RTT, 1.6 Mbps download, and 750 Kbps upload. This is a repeatable lab trace, not field data. PageSpeed Insights API requests were also attempted for all three routes, but Google returned HTTP 429 because the `pagespeedonline.googleapis.com` daily quota was exhausted.

| Route | Performance score | FCP | LCP | TBT | CLS | Speed Index | Lighthouse transfer | Main-thread time | Unused-JS opportunity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 90 | 2.4 s | 3.3 s | 0 ms | 0 | 2.4 s | 290 KiB | 0.9 s | 55 KiB |
| `/calculator/` | 86 | 2.0 s | 3.9 s | 70 ms | 0 | 2.9 s | 281 KiB | 0.9 s | 82 KiB |
| `/filing-waitlist/` | 97 | 2.0 s | 2.1 s | 50 ms | 0 | 2.8 s | 229 KiB | 0.6 s | 55 KiB |

The calculator's largest identified unused-JavaScript opportunities were the shared Supabase vendor (approximately 56 KiB wasted of 58 KiB) and motion vendor (approximately 28 KiB wasted of 42 KiB). The scores, zero layout shift, low blocking time, and existing public Supabase deferral do not justify another shared-vendor refactor in this branch. Revisit only after field data or a route-specific interaction trace identifies a measurable user impact.

## Corrected preview hydration trace — 2026-10-28

After the public prerender/client hydration boundary was hardened, the latest Cloudflare preview was rechecked with Lighthouse `13.6.0` using a fresh mobile context, cache disabled, a 390×844 viewport, and DevTools throttling at 150 ms RTT, 1.6 Mbps download, 750 Kbps upload, and 4× CPU slowdown. These are repeatable lab measurements, not field data.

| Route | Performance score | FCP | LCP | TBT | CLS | Transfer | Requests |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 93 | 2.43 s | 2.43 s | 134 ms | 0 | 333 KiB | 12 |
| `/calculator/` | 83 | 2.24 s | 3.31 s | 295 ms | 0 | 281 KiB | 12 |
| `/filing-waitlist/` | 95 | 2.24 s | 2.24 s | 134 ms | 0 | 279 KiB | 11 |

The calculator remains the slowest route because it loads the largest interactive surface and has the highest blocking time. Shared JavaScript still contributes materially to transfer, but the trace does not identify a safe additional vendor split after the public Supabase deferral and hydration fix. Defer further shared-vendor refactoring until field data or an interaction trace demonstrates a user-visible benefit. The preview also passed route, real-404, and fresh-browser console checks; production was not changed.

## Current branch Fast 3G trace — 2026-10-29

The current documentation branch was deployed to the non-production Cloudflare preview at `https://75c17de3.filesmartnaija.pages.dev` and measured with Lighthouse `13.6.0`. Each route used a fresh mobile run, a 390×844 viewport, cache-disabled DevTools throttling at 150 ms RTT and 1.6 Mbps throughput, and a 4× CPU slowdown. These are lab results, not field Core Web Vitals.

| Route | Score | FCP | LCP | TBT | CLS | Transfer | Main thread | JS bootup | Unused-JS opportunity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 91 | 2.62 s | 2.62 s | 148 ms | 0 | 338 kB | 1.20 s | 282 ms | 56 kB |
| `/calculator/` | 84 | 2.21 s | 3.18 s | 309 ms | 0 | 285 kB | 1.17 s | 467 ms | 56 kB |
| `/filing-waitlist/` | 95 | 2.13 s | 2.13 s | 144 ms | 0 | 288 kB | 0.84 s | 262 ms | 94 kB |

### Diagnosis and decision

1. The calculator is the only materially weaker route. Its LCP element is explanatory form text; Lighthouse attributes approximately 3.03 seconds of its LCP to element-render delay rather than server response time. React bootup accounts for approximately 433 ms of scripting on this route.
2. The shared Supabase vendor is the largest reported unused-JavaScript opportunity on all three routes at roughly 56 kB. The waitlist also reports roughly 38 kB of unused motion code, yet still scores 95 with a 144 ms TBT. Unused bytes alone therefore do not establish a user-visible bottleneck.
3. A further global vendor split is **not justified** by this trace. It would increase cache/request complexity across otherwise healthy routes without addressing the calculator's route-specific render delay.
4. The next performance change, if prioritized, should be an isolated calculator render/interaction profile. Candidate work includes reducing above-the-fold component work or deferring calculator-only animation—not restructuring React or Supabase globally.

Lighthouse wrote complete, parseable JSON reports before its Windows cleanup process stalled. The metrics above were extracted from those completed reports. The generated raw reports were then removed because they are reproducible build artifacts and are not required in source control.
