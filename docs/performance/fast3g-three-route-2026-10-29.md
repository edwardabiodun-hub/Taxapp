# Three-route Fast 3G trace — 2026-10-29

## Scope

This report records a fresh Lighthouse trace against the Cloudflare pull-request preview for the application code in commit `dfd5bbe`:

- Preview: `https://9deaa81c.filesmartnaija.pages.dev`
- Branch: `codex/open-work-followups-20261029`
- Commit: `dfd5bbe4c2baad08ca64738a046be0e9cca677ca`
- Production was not changed.

The follow-up commit `35b5b7d` contains documentation-only updates. Its Cloudflare preview was separately smoke-tested at `https://0cf0b798.filesmartnaija.pages.dev`; no application bundle code changed between the trace and that preview.

## Method

- Lighthouse `13.6.0`
- Fresh mobile browser context with cache disabled
- Viewport: `390 × 844`
- DevTools throttling: `150 ms` RTT, `1.6 Mbps` download, `750 Kbps` upload
- CPU: `4×` slowdown
- Performance category only

## Results

| Route | Performance | FCP | LCP | TBT | CLS | Total byte weight | Requests |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 87 | 3.1 s | 3.2 s | 10 ms | 0 | 334 KiB | 13 |
| `/calculator/` | 77 | 2.4 s | 3.1 s | 530 ms | 0 | 282 KiB | 13 |
| `/filing-waitlist/` | 89 | 2.4 s | 2.4 s | 280 ms | 0 | 277 KiB | 12 |

These are lab measurements, not field data. The preview was reachable and returned the expected prerendered pages during the trace.

## Shared JavaScript observation

All three routes loaded essentially the same script set:

| Shared asset | Transfer | Resource size |
|---|---:|---:|
| `index-iC8_zc7A.js` | ~50 KiB | ~185 KiB |
| `vendor-react-DT4TC-B8.js` | ~47 KiB | ~142 KiB |
| `vendor-router-CievXsLu.js` | ~9 KiB | ~22 KiB |
| `vendor-radix-DADoj7K8.js` | ~17 KiB | ~46 KiB |
| `vendor-icons-DFxMc9hm.js` | ~4 KiB | ~14 KiB |
| `vendor-motion-CuRH-b_C.js` | ~43 KiB | ~125 KiB |
| `vendor-supabase-7KcKRj6y.js` | ~59 KiB | ~227 KiB |

The same shared vendors are requested on the marketing homepage, calculator, and waitlist route. This is material evidence that the public entry point still pays for application-wide code, especially Supabase and motion, even where those capabilities are not needed for first paint.

## Decision

Further vendor optimization is justified as a follow-up, but it should be targeted rather than a blind split:

1. Keep the current PR limited to evidence and the isolated router prototype.
2. Profile why `vendor-supabase` and `vendor-motion` are present on all public routes.
3. Preserve the existing public Supabase deferral and test whether support chat, analytics, authenticated providers, and motion can be isolated from the public shell without changing behavior.
4. Measure the result again on the same three routes before and after the change.

The calculator's `530 ms` TBT is the first optimization target. No production bundle change is included in this PR, and no production deployment was triggered.
