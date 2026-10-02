# FileSmart Phase One Operations

## Scope

Phase One is a Nigeria-wide, local-first preparation experience. Users may select any Nigerian state or the FCT, save a generic preparation, and create universal PDF, CSV, and XLSX exports. An export is not a filing and never implies acceptance by a tax authority.

## Registry and deadline controls

- Review each jurisdiction capability before changing its readiness, submission mode, rule profile, deadline, or API status.
- Record the authority source, effective date, verification date, confidence, and reviewer for every verified rule or deadline.
- Recheck verified rule and deadline evidence at least quarterly and immediately after a Finance Act, tax authority notice, or portal-template change. Mark entries stale when the review date exceeds that cadence.
- Keep unverified entries conservative. Do not promote a state to portal-ready or direct filing without current evidence, validated templates, and an approved integration test.
- Refreshes may update cached registry entries only when the incoming version is newer; equal-version cached evidence is preserved.

## Calculation and export controls

- The Nigerian PIT baseline remains unconfigured until an approved legal source and effective tax-year scope are recorded.
- Universal exports must include schema version, jurisdiction, tax year, readiness, calculation provenance, source metadata, and `notSubmitted: true`.
- Treat `schemaVersion` as a compatibility contract: readers must accept the current version and one prior version, migrations must be additive and tested, and a breaking change requires a new version plus an explicit export-reader migration before rollout.
- Exported packages are for review or manual upload. They do not submit returns or confirm authority acceptance.

## Receipt/OCR controls

- Receipt capture requires user consent and review before any extracted value enters calculation inputs.
- Provider credentials stay server-side; no OCR key, service-role key, LLM key, or private storage credential may be exposed through Vite variables.
- Retain only the minimum receipt metadata and opaque asset reference required for the product workflow. Rejected or unconfirmed values must not enter calculations.
- Provider failures are rendered through safe error codes; raw provider responses and stack traces are never shown to users.

## Feature flags and rollout

Feature flags are independently evaluated. Disabling OCR or submission adapters must not disable generic preparation, the deadline tracker, or universal exports. A rollback disables a feature flag and preserves local preparations, receipts, and export metadata; it does not delete user data.

## Filing adapter promotion evidence

Before enabling a direct or portal-ready adapter, retain evidence of: authority documentation, current schema/template, authenticated sandbox access, successful test submissions, idempotency behavior, error mapping, privacy review, monitoring, rollback, and named approval. Until that evidence exists, use universal export or guided manual filing.
