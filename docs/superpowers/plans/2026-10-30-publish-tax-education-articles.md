# FileSmart Tax Education Articles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish six human-edited Nigerian personal income tax guides in the existing FileSmart education library, with internal calculator/preparation CTAs and visible professional-review status.

**Architecture:** Extend the existing `TaxGuide` content model rather than adding a second blog system. New guides will be registered in `src/content/tax-guides.ts`, rendered by the existing `/learn/:slug` route, included automatically in public route metadata and the sitemap, and linked only to existing internal features.

**Tech Stack:** React, TypeScript, React Router, Vitest, Vite public prerendering.

**Spec:** User-approved six-article publication and editorial pass based on the supplied shared draft.

## Global Constraints

- Preserve the existing `/learn` architecture and public route generation.
- Do not alter tax calculation logic, legal meaning, or published tax figures without source-backed wording.
- Use FileSmart `/calculator` for calculator CTAs; do not link to an external calculator.
- Keep filing claims jurisdiction-aware and avoid implying FileSmart is a government portal.
- Mark all six new guides as pending Nigerian tax-professional review.
- Do not commit secrets or change production deployment configuration.

## Review Focus

- Article claims about filing availability must remain conditional where jurisdiction evidence is incomplete; cover with content assertions.
- Calculator links must remain internal and valid; cover with guide metadata tests.
- Professional-review status must be visible without changing existing guide presentation; cover with component tests where practical.
- Naira formatting must remain intact in tables and copy; cover with content assertions for key examples.
- Public route and sitemap generation must include all six slugs; cover with public-route and build verification.

### Task 1: Extend guide metadata and rendering

**Files:**
- Modify: `src/content/tax-guides.ts`
- Modify: `src/pages/Guide.tsx`
- Test: `src/content/tax-guides.test.ts`

- [ ] Add failing assertions for internal CTAs and pending-review metadata.
- [ ] Run the focused content test and confirm it fails because the metadata does not exist.
- [ ] Add optional `cta` and `reviewStatus` fields to `TaxGuide`.
- [ ] Render a concise pending-review notice and an internal CTA card when metadata is present.
- [ ] Run the focused content test again and confirm it passes.

### Task 2: Import and human-edit the six guides

**Files:**
- Modify: `src/content/tax-guides.ts`
- Test: `src/content/tax-guides.test.ts`

- [ ] Add six guides with the supplied titles, summaries, dates, sources, calculations, FAQs, and caveats.
- [ ] Rewrite formulaic phrasing into direct, varied prose while retaining SEO titles, intent, and tax meaning.
- [ ] Use `/calculator` CTAs for estimate-focused articles and `/filing-waitlist` for the preparation-focused filing article.
- [ ] Keep the online-filing article explicit that procedures vary by tax authority and that FileSmart is not an official government portal.
- [ ] Add assertions for all six slugs, unique metadata, internal CTA paths, and key worked examples.
- [ ] Run the content test and the full test suite.

### Task 3: Validate public output

**Files:**
- No source changes expected unless verification exposes a defect.

- [ ] Run the public build and public-output verification.
- [ ] Confirm all six `/learn/<slug>` routes and sitemap entries are generated.
- [ ] Run `git diff --check` and inspect the final diff for unintended changes.
- [ ] Record tax-professional review as outstanding; do not deploy from this task.

### Task 4: Embed generated human imagery

**Files:**
- Modify: `src/content/tax-guides.ts`
- Modify: `src/pages/Learn.tsx`
- Modify: `src/pages/Guide.tsx`
- Test: `src/content/tax-guides.test.ts`
- Test: `src/pages/Learn.test.tsx`

- [x] Reuse the existing local FileSmart human-image assets rather than adding external image dependencies.
- [x] Add accessible image metadata to every education guide.
- [x] Render lazy-loaded responsive thumbnails on `/learn` and a prominent responsive image on each guide page.
- [x] Validate image source, alt text, focused rendering, full test suite, lint, public build, and crawlable output.
