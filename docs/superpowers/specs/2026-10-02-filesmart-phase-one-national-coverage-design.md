# FileSmart Phase One: National Nigerian Tax Preparation Design

**Status:** Approved product design; implementation plan pending spec review
**Date:** 2026-10-02
**Repository:** `eddyberrysystemsllc/taxease` / `edwardabiodun-hub/Taxapp`

## Context and outcome

FileSmart currently presents a Nigeria-first declaration flow but its data model and country selector are not yet designed for national state coverage, transparent filing capability, or reusable tax-preparation outputs. Phase One should make the product useful to an individual taxpayer in every Nigerian state without claiming that FileSmart can submit to an authority when no validated integration or accepted filing format exists.

The product outcome is an export-first, API-extensible tax-preparation platform:

1. A user can select any Nigerian state or the FCT.
2. A user can complete, save, resume, and review a generic Nigerian PIT preparation workflow for every jurisdiction.
3. FileSmart clearly communicates what is available for the selected jurisdiction: direct filing, portal-ready export, guided manual filing, or not yet supported.
4. Every jurisdiction can produce a universal PDF, CSV, and XLSX package, with a supporting-document index and filing checklist.
5. Deadlines are useful and honest: verified state deadlines take precedence; otherwise a national statutory baseline is shown with a visible verification caveat.
6. Receipt scanning accelerates preparation but never silently injects unconfirmed OCR values into a tax calculation.
7. Future state API integrations can be added as adapters without changing the core workflow or making API access a launch dependency.

## First-principles constraints

### What is assumed by the conventional approach

- A state selector implies state-specific filing capability.
- An exported document is equivalent to an accepted filing.
- An API-looking portal or public integration page means an authorized filing API is available.
- OCR output is accurate enough to use immediately.
- A single national workflow can silently apply state-specific tax rules.

These assumptions are unsafe for a tax product. They create legal, trust, and operational risk if the UI presents preparation as filing or presents estimates as authoritative returns.

### Axioms that govern the design

- Tax rules, deadlines, accepted forms, and API permissions are jurisdiction- and time-dependent.
- FileSmart controls preparation and export, but an authority controls acceptance and filing confirmation unless an official integration proves otherwise.
- A parsed receipt is an untrusted draft until the taxpayer confirms it.
- A capability claim must have a source, verification timestamp, confidence, and an owner for re-verification.
- The product must remain useful even when a state has no API and no validated filing template.

### Resulting product delta

The state is a jurisdiction context, not a promise of submission. `Exported for filing` and `Submitted to authority` are separate states. A universal export is an operational convenience, not a claim that every authority accepts that exact format. State-specific rules are applied only when their source and effective period are verified; otherwise the Nigerian PIT baseline is explicitly labeled as generic.

## Scope

### Phase One in scope

- Coverage for Nigeria's 36 states and the Federal Capital Territory.
- State selection with transparent readiness labels.
- Generic Nigerian PIT preparation, calculation, save/resume, and review.
- State-specific rules and deadlines where verified, with national baseline fallback.
- Universal PDF, CSV, and XLSX output for every jurisdiction.
- Supporting-document index and filing checklist in the export package.
- Receipt/photo capture with managed third-party OCR, review, correction, and confirmation.
- A submission-adapter contract and capability flags for future official integrations.
- Clear preparation, export, and filing-status language.
- Feature flags, audit events, validation, ownership controls, and migration from the current Nigeria-only flow.

### Explicitly out of scope for Phase One

- Making live state API access a launch requirement.
- Representing a user as having filed without an official authority response or user-entered confirmation.
- State-specific filing templates before the required format and workflow have been validated against an official source.
- VAT-compliant invoicing, payment tracking, and accounts-receivable workflows. These remain Phase Two pending separate research and design.
- Questions about the contents of uploaded documents. The receipt scanner extracts structured fields only; document-content interpretation is not part of this release.

## Product capability model

### User-facing readiness labels

Every state and the FCT must show exactly one primary readiness label:

- **Direct filing** — an approved, authenticated authority integration can submit and return an official confirmation/status.
- **Portal-ready export** — FileSmart produces a format and checklist validated for the target authority's portal, but the user completes final upload/submission.
- **Guided manual filing** — FileSmart prepares a generic package and provides authority-specific guidance, but acceptance and final entry remain with the user.
- **Not yet supported** — the user may save preparation and export the universal package, but the relevant authority workflow has not been validated.

The label must be accompanied by a short explanation and a source/verification date where a claim is made. It must not use a locked state tile that implies the state is unavailable when generic preparation is supported.

### Tax-result labels

Every calculation and export must include one of:

- **State-specific estimate** — verified state rules and effective dates were applied.
- **Generic Nigerian PIT estimate** — the Nigerian PIT baseline was applied because state-specific treatment is not verified.
- **Not filing-ready** — required data, source validation, or user confirmations are missing.

The result label must be persisted with the preparation and printed into each export. It must never be inferred solely from the selected state.

### Submission status model

The canonical lifecycle is:

`Draft` → `Ready for review` → `Exported` → `User submitted` → `Authority confirmed`

`User submitted` is a user assertion or adapter event and must not be displayed as `Authority confirmed`. Failed exports and rejected submissions are separate error/status events, not silent returns to `Draft`.

## Architecture

### Current application fit

The repository is a Vite React TypeScript application using React Router, Tailwind/shadcn-style UI components, Dexie local persistence, and a current declaration model in `src/types/declaration.ts`. The current `NewDeclaration` flow persists a declaration as `submitted`; the new semantics must change that behavior so a saved preparation is a draft until the user explicitly exports or confirms a filing action.

The implementation should preserve the current local-first experience while introducing domain boundaries that can later map to authenticated server persistence. No new external service should be a hidden prerequisite for completing and saving a generic preparation.

### 1. State Capability Registry

Create a single registry used by the selector, workflow, deadline service, calculations, export engine, and submission-status UI. The registry should be configuration-driven and versioned rather than scattered across components.

Each jurisdiction entry must contain at least:

- `jurisdictionCode` — stable state/FCT code.
- `name` and `shortName`.
- `countryCode` — `NG` for this release.
- `taxTypes` — initially PIT preparation capability.
- `primaryReadiness` — one of the four user-facing readiness labels.
- `ruleProfile` — verified state profile or generic Nigerian PIT baseline.
- `ruleSource`, `ruleEffectiveFrom`, and `ruleVerifiedAt`.
- `deadlineProfile` — state-specific source or national baseline fallback.
- `deadlineSource`, `deadlineVerifiedAt`, `deadlineConfidence`, and timezone.
- `submissionModes` — adapter, validated export, guided manual, or generic export.
- `apiStatus` — not pursued, discovery, access requested, sandbox, validated, or production-ready.
- `exportFormats` — PDF, CSV, XLSX, and any validated state template.
- `notes` describing limitations and the next verification action.
- `registryVersion` and `lastReviewedBy`.

Unknown or stale values must resolve to conservative labels. A missing source cannot produce a verified state-specific claim.

The registry is the only source of truth for capability claims. UI components must not hardcode lists of enabled states or independently infer support from country/theme data.

### 2. Generic tax-preparation workflow

Refactor the existing declaration form into a jurisdiction-aware preparation model while preserving the familiar step flow:

1. Jurisdiction and tax year.
2. Personal/employment/business income.
3. Investment and other income.
4. Benefits and deductions.
5. Receipts and supporting documents.
6. Review, confidence, and filing readiness.
7. Export and next steps.

The workflow must support:

- all 37 Nigerian jurisdictions;
- partial completion and save/resume;
- explicit source method (`state-specific` or `generic-national-baseline`);
- field-level validation and calculation provenance;
- required-field and missing-evidence warnings;
- recalculation when a registry version changes;
- a review summary showing assumptions, excluded fields, and unresolved items;
- a no-surprises status transition from draft to ready/exported.

The existing Nigeria-specific field model may be retained as the first baseline schema, but the domain type must stop encoding the jurisdiction as a country-only concept. Add a stable `jurisdictionCode`, `taxYear`, `ruleProfileVersion`, `calculationLabel`, and `filingReadiness` to the preparation record. Do not create separate duplicated form components for each state.

### 3. Submission adapter layer

Define a stable adapter contract conceptually equivalent to:

- `prepare(preparation, capability)` — validates prerequisites and produces a submission package.
- `submit(package, credentials/context)` — only implemented for an approved official integration.
- `getStatus(reference)` — returns an authority-backed status when available.
- `capabilities()` — declares what the adapter can actually do.

The universal export path is the default adapter. State API adapters are registered behind capability flags and must fail closed when the registry does not mark them as validated. An adapter must never report `Authority confirmed` from an HTTP 200 response alone; it needs an official confirmation/reference or a documented authority response contract.

### 4. Universal export engine

Every jurisdiction must be able to produce:

- a human-readable PDF summary;
- a normalized CSV data extract;
- an XLSX workbook with a summary sheet, income/deductions detail, assumptions, and document index;
- a supporting-document index containing file name, category, date, amount, confirmation state, and hash/reference where available;
- a filing checklist with the selected authority, readiness label, missing items, source dates, and clear instructions that the package has not been submitted.

Export metadata must include jurisdiction, tax year, generated time, registry/rule versions, calculation label, and preparation ID. Universal output must use stable column names and a documented schema version. State-specific templates can be added only after official format validation and must be represented as additional registry capabilities, not as replacements for universal outputs.

### 5. Deadline service

The deadline service should resolve a displayable deadline in this order:

1. Current, verified state-specific deadline for the selected tax type and tax year.
2. Verified national statutory baseline.
3. No countdown claim; display `Deadline not verified` and provide a source-verification action.

The UI must always show a countdown when a valid deadline exists, including days and a time-aware phrase such as `12 days remaining` or `Deadline passed`. The countdown must be computed from an absolute timestamp using the authority's applicable timezone, not from a client timer that changes the underlying deadline. It should update at display boundaries and clean up listeners on unmount.

Each deadline card must show its source class, source URL/reference, verification date, tax year, recurrence/effective period, and confidence. The fallback label must read like `National statutory baseline — confirm with your tax authority`, not like a state-specific promise.

### 6. Receipt scanner and OCR workflow

Use a managed third-party OCR provider in the first release behind a provider interface so the vendor can be changed without rewriting the workflow. The scanner extracts only structured receipt fields:

- vendor;
- receipt date;
- gross amount;
- tax amount when visible;
- currency;
- category;
- OCR confidence per field;
- provider/model/version metadata.

The lifecycle is:

`Captured` → `Upload consent` → `OCR processing` → `Needs review` → `User confirmed` or `Rejected`

Rules:

- OCR values are drafts and cannot enter a calculation until the user confirms them.
- The original image remains linked to the record for auditability and user review.
- Low-confidence or conflicting fields are visibly highlighted.
- Users can correct every extracted field and can remove the image/record.
- The UI must disclose the OCR provider category, processing purpose, retention period, and that data is not used to train the provider model where contractually supported.
- Files are validated by type and size, stored privately and non-executably, accessed through scoped URLs, and removed according to retention policy.
- OCR failures must preserve the original upload and allow manual entry without blocking the tax preparation.

Exact provider selection, data-processing agreement, retention period, and residency terms are implementation gates. The implementation plan must compare providers against Nigerian privacy obligations, security controls, field accuracy, price, and operational fallback before one is enabled in production.

### 7. Persistence and data model

Extend local persistence with separate records for:

- `preparations` — draft/ready/exported preparation state and versioned form data;
- `jurisdictionCapabilities` — cached registry entries and sync metadata;
- `deadlines` — source, effective period, confidence, and computed deadline;
- `receiptRecords` — original asset reference, OCR fields, confidence, review status, and user corrections;
- `exportPackages` — format, schema version, generated time, artifact reference, and status;
- `submissionEvents` — immutable preparation/export/user-assertion/authority-confirmation events.

If server persistence is used, every row must be owner-scoped with row-level access controls. Local records must be migration-safe and retain old drafts without falsely upgrading their status. A database migration is required for the existing declaration shape; the migration must map existing `country: ng` records to Nigeria context and mark prior `submitted` records for review if no authority confirmation exists.

## UX and interaction requirements

### Jurisdiction selection

The current country-selection concept should become Nigerian jurisdiction selection for the declaration flow. Show all states and the FCT as selectable. Use search/filtering and a compact readiness badge. A user can start generic preparation even when direct filing is unavailable.

The profile country/theme setting is separate from the declaration's tax jurisdiction and must not determine filing capability. The declaration selector must not allow a non-Nigeria jurisdiction in this phase.

### Preparation and review

Show a persistent context strip with selected jurisdiction, tax year, calculation label, readiness label, and last saved time. The review step must answer:

- What did FileSmart calculate?
- Which rule profile was used?
- What documents were confirmed?
- Is this ready for export?
- What remains for the user to file with the authority?

### Export and filing handoff

After export, present the artifact links and next step based on capability:

- direct filing: `Continue to official submission` and later authority confirmation;
- portal-ready export: `Download package and upload to the authority portal`;
- guided manual filing: checklist plus authority portal/manual instructions;
- not yet supported: universal package plus an explicit limitation notice.

Never use `Submitted` on a button that only downloads or generates a file. Never hide the authority handoff behind a disabled control without explaining why.

### Deadline tracker

Provide a reusable dashboard card and a preparation-context card. Both show the same resolved deadline model and source label. Include empty/unverified, passed, offline/stale, and source-fetch-failed states. A stale cached deadline can be shown only with a stale indicator and last-verified date.

### Responsive and accessibility standards

- Mobile-first layout; no horizontal scrolling for state cards, export tables, or OCR review.
- Keyboard and screen-reader access for state search, readiness labels, countdown, upload/review controls, and exports.
- Tooltips/popovers must not be the only place a capability limitation is communicated.
- Long state names, long vendor names, large amounts, and missing receipt images must not break layout.
- `aria-live` is appropriate for countdown status changes but must not announce every second; announce meaningful boundary changes only.

## Security, privacy, and compliance controls

- Validate upload MIME type, extension, file signature where applicable, and size before storage; reject executable/script types.
- Store originals in private, non-executable storage. Use owner-scoped access and short-lived signed URLs.
- Do not place receipt images, OCR content, tax IDs, or access tokens in logs, analytics events, URLs, CSV filenames, or error messages.
- Encrypt data in transit and at rest; document the OCR provider's processing location and sub-processors.
- Require explicit consent before sending an image to the OCR provider; provide deletion and retention controls.
- Treat OCR and imported data as untrusted input; validate numeric ranges, currency, dates, and category values server-side before calculation.
- Keep all preparation, correction, export, and submission events auditable without storing unnecessary PII.
- Enforce authorization on every preparation, receipt, and export artifact. A client-side state selector or hidden UI element is not an access control.
- Preserve the legal distinction between tax information and professional advice in product copy and exports.

## Testing and verification strategy

### Unit and domain tests

- registry lookup, validation, versioning, and conservative fallback;
- state-specific versus generic calculation labels;
- deadline precedence, timezone, past deadline, stale source, and missing source;
- countdown boundary calculations without per-second network polling;
- OCR confidence thresholds, correction, rejection, and confirmed-only calculation input;
- export schema stability and metadata for PDF/CSV/XLSX;
- submission-state transitions that reject invalid jumps;
- migration of existing Nigeria-only declarations.

### Component and flow tests

- all 37 states plus FCT render and are selectable;
- capability labels and explanatory copy match registry values;
- draft save/resume works after partial completion and offline recovery;
- no unsupported state is presented as direct filing;
- exports distinguish `Exported` from `Submitted`;
- receipt upload, review, correction, and confirmation are keyboard-accessible;
- deadline cards display verified and fallback labels correctly;
- long text, empty datasets, network failure, and OCR failure render safe states.

### Security and operational tests

- unauthorized artifact access is rejected;
- upload validation rejects executable/polyglot payloads and oversized files;
- signed URLs expire and cannot cross owners;
- OCR provider failure does not lose the original receipt or mark the record confirmed;
- feature flags can disable individual adapters without disabling generic preparation/export;
- production observability reports export/OCR/deadline failures without PII.

## Rollout and migration

1. Introduce registry and domain types behind a feature flag while retaining the current Nigeria baseline.
2. Migrate current declarations to `jurisdictionCode = NG-FCT or state code` when known; otherwise preserve Nigeria context and mark the record for user confirmation.
3. Replace country-only declaration selection with the 37-jurisdiction selector.
4. Change the current terminal `submitted` write to `Draft` or `Ready for review`; add explicit export and user-submission actions.
5. Enable universal PDF/CSV/XLSX exports for all jurisdictions.
6. Enable deadline tracker with verified data and national fallback.
7. Enable OCR for a controlled cohort after provider/security approval; retain manual receipt entry as the reliable fallback.
8. Add state-specific templates or adapters only after independent validation and capability-registry approval.

Feature flags should cover national selector, generic preparation, universal exports, deadline tracker, OCR, and each submission adapter independently. The launch must remain functional with every adapter flag off.

## Success measures

- users can select any Nigerian jurisdiction and reach a saved draft;
- generic preparation completion and resume rates;
- export success rate by format and jurisdiction;
- percentage of exports with explicit readiness/calculation labels;
- deadline-card engagement and source freshness;
- OCR field confirmation/correction rate by confidence band;
- zero false `Authority confirmed` states;
- state-specific templates/adapters added only with recorded source validation;
- no critical security/privacy findings in upload or artifact-access review.

## Implementation gates before coding

The implementation plan must resolve and document:

1. The authoritative Nigerian PIT baseline source and effective tax-year version.
2. The initial registry data ownership and review process, including who can approve a deadline or filing capability change.
3. The OCR provider and signed data-processing/retention terms.
4. The export schema version and whether XLSX generation runs fully in-browser or through a controlled backend service.
5. The target persistence boundary: local-only for the first increment or authenticated server persistence for saved preparations.
6. The minimum launch evidence required before a state changes from guided manual filing to portal-ready export or direct filing.

These are implementation decisions, not reasons to block national generic preparation. Until they are resolved, the system must use conservative labels and keep universal exports available.
