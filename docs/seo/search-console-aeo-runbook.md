# Search Console and AEO validation runbook

## Purpose

Use this runbook to repeat the FileSmart AEO benchmark once the public deployment is verified and Google Search Console access is available. The benchmark records observations; it does not turn search visibility into a product or tax-accuracy claim.

## Prerequisites

- Confirm the public canonical domain and deployment build ID.
- Confirm `https://www.filesmartnaija.com/robots.txt` and `https://www.filesmartnaija.com/sitemap.xml` are reachable.
- Verify the deployed unknown-route probe returns HTTP `404` with the branded not-found page.
- Use Search Console access for the verified property, or an accessible browser that can capture the result page and cited source.
- Do not submit credentials, taxpayer data, or private application URLs to a search or answer engine.

## Search Console workflow

1. Open the verified domain property in Google Search Console.
2. Inspect the canonical homepage and representative public routes from `docs/seo/aeo-benchmark.md`.
3. Record indexing status, canonical selected by Google, last crawl date, and any enhancement or coverage error.
4. Submit the sitemap only if it is not already present; do not create duplicate sitemap entries.
5. Recheck after Google has crawled the public pages. Do not mark an AEO row as observed from an indexing-status screen alone.

## Accessible-browser workflow

For each benchmark question, run a consistent query in the selected engine, for example:

```text
site:filesmartnaija.com FileSmart tax calculator
```

Record:

- date and time;
- engine and query;
- result URL and page title;
- whether FileSmart was surfaced;
- whether an answer or featured result cited FileSmart;
- the cited source URL, if any;
- reviewer notes and screenshot/log reference.

Keep rows `NOT_RUN` when the result page cannot be accessed or no reproducible observation can be captured. A site-restricted search with no results is an observation of no surfaced result for that query, not proof of a technical indexing failure.

## Acceptance criteria

- Every recorded row has a query, timestamp, engine, and reproducible result reference.
- No row claims tax accuracy without a source-backed content review.
- No row claims authority acceptance, direct filing, or API integration unless the relevant evidence register supports it.
- Public route, canonical, sitemap, and real-404 checks pass before interpreting search results.
