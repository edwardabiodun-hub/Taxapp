# FileSmart staging and production rollback plan

This plan is preparatory. It does not authorize a production rollback or database operation.

## Application deployment

1. Record the current live deployment ID, Git commit, environment variables, and hosting configuration before release.
2. Prefer the hosting provider's immutable deployment rollback to the last known-good deployment. Do not rebuild from an unpinned working tree during an incident.
3. Confirm the rollback serves the expected commit and public routes, then run the public smoke checks and the calculator no-submission check.
4. If the issue is isolated to a feature, disable the feature flag first where possible; keep user data intact.

## Database and Supabase changes

- Confirm a recoverable backup exists before any schema change.
- Do not run a down migration blindly against production. First identify whether data or newer dependencies would be lost.
- For additive schema/RPC changes, prefer a forward fix or restore to an isolated environment, then obtain owner approval for production action.
- After recovery, validate RLS isolation, authentication, account synchronization, messages, reminders, and existing preparation records.
- Keep reminder email delivery disabled until the Edge Function, secrets, scheduler, and test recipient path are independently validated.

## Incident communication and evidence

- Record the incident start time, affected deployment, symptoms, mitigation, and decision owner.
- Preserve logs and deployment metadata; do not include taxpayer documents, credentials, or secret values.
- Notify affected stakeholders with a factual status and next update time.
- After rollback, open a follow-up defect with root cause, prevention, and a test that would have caught it.

## Rollback verification

- [ ] Hosting reports the intended known-good deployment active.
- [ ] DNS/TLS and required security headers are present.
- [ ] Public routes, 404, calculator, auth, and core preparation flows pass smoke tests.
- [ ] No new database objects or policy changes remain partially applied.
- [ ] Monitoring shows recovery and no elevated error rate.

## Preview rollback reference — October 28, 2026

The non-production preview currently points to Cloudflare deployment `4c6b8f21`, built from commit `126a229`, at `https://codex-public-seo-conversion-rm52.filesmartnaija.pages.dev`. If preview validation fails, roll back that preview to the last known-good immutable Cloudflare deployment for the same branch and rerun the route verifier, including `/filing-waitlist/` and the real `404` probe. Do not change `www.filesmartnaija.com` as part of preview rollback.
