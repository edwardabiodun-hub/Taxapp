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
