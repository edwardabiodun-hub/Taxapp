# FileSmart Security Remediation Design

## Goal

Close the verified security gaps from the FileSmart audit without weakening the current Supabase RLS model or breaking the existing offline-first user experience.

## Scope

1. Enforce cross-row ownership for activities.
2. Replace broad database projections with explicit column allow-lists.
3. Add shared, server-side rate limiting keyed by both account and client IP.
4. Add idempotency protection to the message-email webhook.
5. Remove user control over authoritative declaration/profile fields through database write guards and typed RPC boundaries.
6. Upgrade the vulnerable production router dependency.
7. Add regression tests for the new security invariants.

## Design

### Ownership

Keep existing RLS policies as the primary read/write boundary. Add a database trigger enforcing that every activity references a declaration owned by the same `user_id`. This protects both normal authenticated writes and privileged staff writes from cross-user references.

### PII projections

Keep the existing client-side row types, but make the database projection explicit in `src/lib/api.ts`. No query in the client synchronization layer will use `select("*")`.

### Rate limiting

Because the browser currently calls Supabase Auth directly, add a server-side auth gateway Edge Function. The gateway will apply atomic database-backed limits for both a normalized account key and a trusted platform-provided IP key before forwarding the request to Supabase Auth. It will cover sign-in, sign-up, resend confirmation, password reset, and password update operations. Client-side cooldowns remain usability improvements only.

### Write protection

Keep explicit field mapping in the client, but treat it as non-authoritative. Database triggers will prevent authenticated callers from changing ownership, staff-controlled status, amount, audit timestamps, and deletion markers. User-facing writes will be narrowed to typed RPCs where an operation needs more control than column privileges provide.

### Email webhook

Retain the shared webhook secret and service-role re-read. Add a private delivery ledger keyed by message ID so repeated webhook deliveries do not produce repeated emails.

### Dependency

Upgrade `react-router-dom` to a patched 6.x release compatible with the current application and regenerate the lockfile. Re-run the audit afterward; build-only dependency advisories will be separated from runtime exposure.

## Verification

- Add failing tests before each production-code change.
- Run focused tests for API projections, write guards, rate-limit behavior, and webhook idempotency.
- Run the complete Vitest suite.
- Run TypeScript/build/lint checks.
- Run `npm audit` and document remaining advisories.

## Deployment boundary

This change updates repository code and migrations only. Applying migrations, deploying Edge Functions, changing Supabase Auth settings, and publishing production artifacts remain separate explicitly authorized actions.
