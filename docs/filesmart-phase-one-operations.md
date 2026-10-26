# FileSmart Phase One Operations

## Scope

Phase One is a Nigeria-wide, local-first preparation experience. Users may select any Nigerian state or the FCT, save a generic preparation, and create universal PDF, CSV, and XLSX exports. An export is not a filing and never implies acceptance by a tax authority.

## Registry and deadline controls

- Review each jurisdiction capability before changing its readiness, submission mode, rule profile, deadline, or API status.
- Record the authority source, effective date, verification date, confidence, and reviewer for every verified rule or deadline.
- Recheck verified rule and deadline evidence at least quarterly and immediately after a Finance Act, tax authority notice, or portal-template change. Mark entries stale when the review date exceeds that cadence.

## Abandoned preparation reminders

- `preparation_reminder_states` stores only owner-scoped lifecycle and deadline metadata. It must never be populated with tax amounts, form data, receipt contents, document names, or tax IDs.
- Apply `supabase/migrations/20261026000000_preparation_reminders.sql` before deploying the reminder function.
- Deploy `supabase/functions/abandoned-preparation-reminders` with `ABANDONED_PREPARATION_CRON_SECRET` and the app's actual `APP_URL` secrets.
- Configure a trusted scheduler to POST to the function at least daily with the `x-cron-secret` header. The repository does not provision a production scheduler; do not invoke the function from the browser.
- `email_reminders_enabled` defaults to false. Email requires a verified address, explicit reminder consent, and a configured transactional email provider.
- The application currently delivers in-app reminder messages. Keep email reminders disabled until a user-facing consent control and the email webhook/provider configuration are verified.
- Reminder message keys are unique per user, preparation, and reminder count, preventing duplicate messages from concurrent scheduler runs. Cooldown and reminder-count checks limit further reminders.
- If a user resumes, submits, or dismisses a preparation, the scheduler must not create another reminder. If preparation deletion is added, it must mark the server-side reminder state deleted or dismissed.
- Reminder emails and browser notifications must not contain tax amounts, document names, tax IDs, or document contents.
- Keep unverified entries conservative. Do not promote a state to portal-ready or direct filing without current evidence, validated templates, and an approved integration test.
- Refreshes may update cached registry entries only when the incoming version is newer; equal-version cached evidence is preserved.

## Calculation and export controls

- The Nigerian PIT baseline remains unconfigured until an approved legal source and effective tax-year scope are recorded.
- Universal exports must include schema version, jurisdiction, tax year, readiness, calculation provenance, source metadata, and `notSubmitted: true`.
- Treat `schemaVersion` as a compatibility contract: readers must accept the current version and one prior version, migrations must be additive and tested, and a breaking change requires a new version plus an explicit export-reader migration before rollout.
- Exported packages are for review or manual upload. They do not submit returns or confirm authority acceptance.

## Receipt/OCR controls

- Receipt capture requires user consent and review before any extracted value enters calculation inputs.
- The upload and persistence boundaries both reject executable/script extensions, unsupported MIME types, and files over the 10 MB receipt limit. Keep this check in the release gate when changing receipt storage or OCR paths.
- Provider credentials stay server-side; no OCR key, service-role key, LLM key, or private storage credential may be exposed through Vite variables.
- Retain only the minimum receipt metadata and opaque asset reference required for the product workflow. Rejected or unconfirmed values must not enter calculations.
- Provider failures are rendered through safe error codes; raw provider responses and stack traces are never shown to users.

## Security release gate

- Run the bounded security test file and record the result in the release checklist before any phase-one release review.
- Treat failed security-boundary, migration, lint, or build checks as release blockers. This gate records evidence; it does not authorize production deployment.
- In the local-first Dexie model, receipt reads are scoped by preparation ID. A multi-owner/server implementation must add an explicit owner authorization boundary before it is enabled.

## Feature flags and rollout

Feature flags are independently evaluated. Disabling OCR or submission adapters must not disable generic preparation, the deadline tracker, or universal exports. A rollback disables a feature flag and preserves local preparations, receipts, and export metadata; it does not delete user data.

## Filing adapter promotion evidence

Before enabling a direct or portal-ready adapter, retain evidence of: authority documentation, current schema/template, authenticated sandbox access, successful test submissions, idempotency behavior, error mapping, privacy review, monitoring, rollback, and named approval. Until that evidence exists, use universal export or guided manual filing.
