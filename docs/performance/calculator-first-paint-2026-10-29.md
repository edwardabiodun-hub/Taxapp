# Calculator first-paint optimization — 2026-10-29

## Scope

This report records the post-merge measurement for the calculator first-paint change in commit `9885205`, now included in `taxapp/main` through PR #35 (`72b3455`). The change removes the public calculator's whole-page `opacity: 0` animation gate so meaningful content can paint immediately. It does not change tax logic, inputs, deductions, or submission behavior.

The measurement was captured against the non-production Cloudflare preview `https://c300c55a.filesmartnaija.pages.dev` before the change was merged. The production branch now contains the same code; a new deployed Fast 3G trace for all three routes remains a separate follow-up.

## Method

- Lighthouse `13.6.0`
- Fresh mobile run with cache disabled
- Viewport: `390 × 844`
- Network: `150 ms` RTT, `1.6 Mbps` download, `750 Kbps` upload
- CPU: `4×` slowdown
- Route: `/calculator/`

## Results

| Metric | Corrected baseline | Post-change preview | Delta |
|---|---:|---:|---:|
| Performance score | 83 | 93 | +10 |
| First Contentful Paint | 2.24 s | 2.12 s | -0.12 s |
| Largest Contentful Paint | 3.31 s | 2.12 s | -1.19 s |
| Total Blocking Time | 295 ms | 224 ms | -71 ms |
| Speed Index | Not retained | 2.12 s | — |
| Cumulative Layout Shift | 0 | 0 | unchanged |
| Total byte weight | 281 KiB | 282 KiB | +1 KiB |

## Decision

The route-specific rendering fix materially improved the calculator without increasing the transfer footprint in a meaningful way. Existing lazy-loading boundaries already defer the PDF/XLSX exporters, and the post-change preview still shows a shared same-origin asset footprint of approximately `628 KiB`. A further vendor split is not justified from this single-route result. Re-run a real Fast 3G trace against `/`, `/calculator/`, and `/filing-waitlist/` before making another shared-chunk change.

## Validation evidence

The source branch passed lint, the serial CI suite (`122` files / `870` tests at the time of the change), `npm run build:public`, and `npm run verify:public` before merge. Cloudflare later deployed the merged `72b3455` commit to production and the post-merge route smoke checks passed.
