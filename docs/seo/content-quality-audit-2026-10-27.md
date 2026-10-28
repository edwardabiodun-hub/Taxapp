# Local SEO/AEO content-quality audit — 2026-10-27

## Scope

This audit reviews repository content and generated public output. It does not claim that Google or an answer engine has indexed or cited FileSmart.

## Verified strengths

- `src/lib/public-routes.ts` is the single metadata source for the public sitemap and route titles/descriptions.
- `scripts/prerender-public.mjs` renders the public routes to initial HTML, including the four educational guides.
- `src/lib/public-document.ts` emits escaped titles/descriptions, canonical URLs, Open Graph tags, Twitter title/description tags, and `WebPage` JSON-LD.
- `scripts/verify-public-output.mjs` checks that each generated HTML page has an H1 and canonical URL, that the sitemap count matches generated pages, and that `404.html` exists.
- Educational guides in `src/content/tax-guides.ts` include summaries, categories, dates, reading time, source notes, and source URLs. Guide content includes worked examples, caution callouts, and links to the calculator or preparation workflow.
- `public/robots.txt` excludes authenticated/private application routes. This is an indexing control only; it is not an authorization control.

## Quality gaps retained for review

- The guides use 2026 tax-law claims and need a qualified Nigerian tax professional's final review before those claims are treated as authoritative.
- The legal pages are explicitly draft/pending approval. They should not be presented as final legal terms until the operator approves the effective date, privacy details, retention language, dispute terms, and final contact process.
- AEO benchmark rows remain `NOT_RUN` in `docs/seo/aeo-benchmark.md`. No external visibility or citation claim should be made from the local checks.
- The public route metadata contains useful search terms such as Nigerian personal income tax and Nigeria Tax Act 2025 where context requires them; reducing repetition must not remove those intent-bearing phrases.
- There is no evidence register for testimonials, security claims, or authority partnerships in this audit. Those claims should remain absent unless separately verified.

## Recommended content actions

1. Obtain professional source review for tax calculations and legal statements before launch.
2. Add named author/reviewer metadata only when real accountable people have approved publication.
3. Run the AEO questions manually or through an approved measurement process and record the observed answer, source, route, date, and reviewer.
4. Re-run the public-output verifier after every route, guide, or metadata change.

## Result

The local SEO/AEO foundation is structurally ready for staging validation. Content authority and legal finalization remain governance gates, not code defects.
