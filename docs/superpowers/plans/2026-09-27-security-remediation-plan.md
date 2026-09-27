# FileSmart Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the verified FileSmart security gaps in code and migrations while preserving the existing offline-first behavior.

**Architecture:** Keep Supabase RLS as the row authorization boundary, add database triggers/RPCs for field-level write authorization, and add a Supabase Edge Function gateway for authentication rate limiting. Keep the webhook secret and add idempotent delivery tracking.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Supabase PostgreSQL migrations, Supabase Edge Functions/Deno, `@supabase/supabase-js`.

**Spec:** `docs/superpowers/specs/2026-09-27-security-remediation-design.md`

## Global Constraints

- No `select("*")` remains in the client synchronization API.
- Ownership checks execute server-side and do not depend on React route guards.
- Rate limits use both account and trusted client-IP keys with shared storage.
- Authenticated users cannot control authoritative declaration status, amount, timestamps, ownership, or profile deletion markers.
- Webhook retries do not send duplicate message emails.
- Repository changes do not apply migrations, deploy functions, or publish production artifacts.

## Review Focus

- Cross-user activity reference is rejected.
- Direct PostgREST extra declaration/profile properties are rejected or server-controlled.
- One IP attacking multiple accounts is stopped by the IP budget.
- One account attacking from multiple IPs is stopped by the account budget.
- Repeated webhook delivery produces one successful email.

---

### Task 1: Explicit PII projections

**Files:** Modify `src/lib/api.ts:41-45,143-147,205-209,255-259`; test `src/lib/api.test.ts`.

**Produces:** The existing four fetch functions with explicit projections and unchanged return types.

- [ ] **Step 1: Write the failing tests.** Assert each mocked query calls `select()` with its exact allow-list and never with `"*"`.
- [ ] **Step 2: Run `npx vitest run src/lib/api.test.ts`; expected failure because the implementation uses `select("*")`.**
- [ ] **Step 3: Replace the projections with:**

```ts
// profiles
.select("id,name,phone,tax_id,country,date_of_birth,country_of_birth,gender,nationality,consent_accepted_at")
// declarations
.select("id,tax_year,country,state,type,status,form_data,documents,amount,created_at,updated_at")
// activities
.select("id,declaration_id,type,title,description,meta,timestamp")
// messages
.select("id,declaration_id,category,subject,body,read_at,created_at")
```

- [ ] **Step 4: Run `npx vitest run src/lib/api.test.ts` and `npm run build`; expected pass.**
- [ ] **Step 5: Commit with `git add src/lib/api.ts src/lib/api.test.ts; git commit -m "fix: restrict client database projections"`.**

### Task 2: Activity ownership enforcement

**Files:** Create `supabase/migrations/20260927000000_security_remediation.sql`; add a database fixture test only if a local Supabase/Postgres runner exists.

**Produces:** Trigger `public.activities_check_declaration_ownership` covering INSERT and UPDATE.

- [ ] **Step 1: Add a failing database fixture** inserting an activity with a declaration ID owned by another user; expected result is that the current schema accepts it or the local database harness is unavailable.
- [ ] **Step 2: Add this migration:**

```sql
create or replace function public.check_activity_declaration_ownership()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if not exists (
    select 1 from public.declarations d
    where d.id = new.declaration_id and d.user_id = new.user_id
  ) then
    raise exception 'declaration_id % does not belong to user_id %',
      new.declaration_id, new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_check_declaration_ownership on public.activities;
create trigger activities_check_declaration_ownership
before insert or update on public.activities
for each row execute function public.check_activity_declaration_ownership();
```

- [ ] **Step 3: Validate migration syntax and confirm the trigger covers both operations.**
- [ ] **Step 4: Commit with `git add supabase/migrations/20260927000000_security_remediation.sql; git commit -m "fix: enforce activity declaration ownership"`.**

### Task 3: Field-level declaration/profile write protection

**Files:** Modify `supabase/migrations/20260927000000_security_remediation.sql` and `src/lib/api.ts:64-77,90-104,167-187`; test `src/lib/api.test.ts` and `src/lib/account-deletion.test.ts`.

**Produces:** Authenticated callers cannot change staff-authoritative declaration/profile fields.

- [ ] **Step 1: Add failing tests** asserting declaration sync does not send authoritative `amount`, and ordinary profile sync does not send `pseudonymized_at`.
- [ ] **Step 2: Run `npx vitest run src/lib/api.test.ts src/lib/account-deletion.test.ts`; expected failure because current declaration sync sends `amount` and direct pseudonymization updates `pseudonymized_at`.**
- [ ] **Step 3: Add the declaration guard:**

```sql
create or replace function public.guard_user_declaration_write()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if auth.uid() is null then return new; end if;
  if new.user_id <> auth.uid() then raise exception 'Cannot change declaration ownership'; end if;
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'submitted') then raise exception 'Invalid initial declaration status'; end if;
    new.amount := null; new.synced_at := null; new.created_at := now();
  else
    new.status := old.status; new.amount := old.amount; new.user_id := old.user_id;
    new.created_at := old.created_at; new.synced_at := old.synced_at;
  end if;
  return new;
end;
$$;

drop trigger if exists declarations_guard_user_write on public.declarations;
create trigger declarations_guard_user_write
before insert or update on public.declarations
for each row execute function public.guard_user_declaration_write();
```

Add a profile guard preventing authenticated callers from changing `id` or `pseudonymized_at`; move pseudonymization to a privileged typed function.

- [ ] **Step 4: Remove `amount` from the authoritative declaration upsert payload and route pseudonymization through the typed server operation.** Keep local amount for display only.
- [ ] **Step 5: Run focused tests and `npm run build`; expected pass.**
- [ ] **Step 6: Commit with `git add supabase/migrations/20260927000000_security_remediation.sql src/lib/api.ts src/lib/api.test.ts src/lib/account-deletion.test.ts; git commit -m "fix: guard authoritative user write fields"`.**

### Task 4: Shared rate-limit storage and auth gateway

**Files:** Create `supabase/migrations/20260927010000_rate_limits.sql`, `supabase/functions/_shared/rate-limit.ts`, `supabase/functions/auth-gateway/index.ts`, and `src/lib/rate-limit.test.ts`; modify `src/lib/auth.ts`.

**Produces:** Gateway paths `/signup`, `/signin`, `/resend`, `/reset`, `/update` with account and IP limits.

- [ ] **Step 1: Write failing tests** for both budgets, denial when either budget is exhausted, trusted IP extraction, and operation forwarding.
- [ ] **Step 2: Run `npx vitest run src/lib/rate-limit.test.ts`; expected failure because helper and gateway do not exist.**
- [ ] **Step 3: Create a private `rate_limits` table and atomic `private.consume_rate_limit(key, limit, window_seconds)` RPC. Store only hashed account/IP keys and grant execution to `service_role`.**
- [ ] **Step 4: Implement `enforceDualLimit(client, input)` to call the RPC once for the account key and once for the trusted platform IP key.**
- [ ] **Step 5: Implement the gateway forwarding:**

```text
/signup -> POST /auth/v1/signup
/signin -> POST /auth/v1/token?grant_type=password
/resend -> POST /auth/v1/resend
/reset  -> POST /auth/v1/recover
/update -> PUT /auth/v1/user
```

Use limits of 5/account and 30/IP per 15 minutes for sign-in; 3/account and 10/IP per hour for sign-up; 3/account and 10/IP per 15 minutes for resend/reset; and 5/account and 20/IP per 15 minutes for password updates. Never trust arbitrary client-supplied forwarded-IP headers.
- [ ] **Step 6: Refactor `src/lib/auth.ts` to call the gateway while preserving `AuthResult`; keep session refresh on the normal Supabase client.**
- [ ] **Step 7: Run `npx vitest run src/lib/auth.test.ts src/lib/rate-limit.test.ts` and `npm run build`; expected pass.**
- [ ] **Step 8: Commit with `git add supabase/migrations/20260927010000_rate_limits.sql supabase/functions/_shared/rate-limit.ts supabase/functions/auth-gateway/index.ts src/lib/auth.ts src/lib/rate-limit.test.ts; git commit -m "fix: add dual-layer auth rate limiting"`.**

### Task 5: Webhook idempotency

**Files:** Modify `supabase/migrations/20260927000000_security_remediation.sql` and `supabase/functions/send-message-email/index.ts`; test `supabase/functions/send-message-email/index.test.ts`.

**Produces:** Repeated delivery of the same message ID sends one successful email.

- [ ] **Step 1: Write a failing duplicate-delivery test** invoking the handler twice with one message ID and expecting one Resend call.
- [ ] **Step 2: Run `npx vitest run supabase/functions/send-message-email/index.test.ts`; expected failure because every valid webhook currently sends.**
- [ ] **Step 3: Add private `message_email_deliveries` keyed by `message_id`, with attempt count, status, last error, and sent timestamp. Claim atomically before sending.**
- [ ] **Step 4: Update the function to return 200 without sending when status is already `sent`; mark `sent` only after Resend succeeds.**
- [ ] **Step 5: Run the focused webhook test and commit with `git add supabase/migrations/20260927000000_security_remediation.sql supabase/functions/send-message-email/index.ts supabase/functions/send-message-email/index.test.ts; git commit -m "fix: make message email delivery idempotent"`.**

### Task 6: Dependency and supply-chain hardening

**Files:** Modify `package.json`, `package-lock.json`, and `supabase/functions/send-message-email/index.ts`; create `supabase/functions/deno.json`.

- [ ] **Step 1: Write a dependency-version regression check requiring `react-router-dom >= 6.30.4`.**
- [ ] **Step 2: Upgrade `react-router-dom` to `^6.30.4` and regenerate only the necessary lockfile entries.**
- [ ] **Step 3: Replace the mutable Edge import `https://esm.sh/@supabase/supabase-js@2` with the exact tested version and record the import in `supabase/functions/deno.json`.**
- [ ] **Step 4: Run `npm audit --omit=dev` and `npm run build`; document remaining build-only advisories.**
- [ ] **Step 5: Commit with `git add package.json package-lock.json supabase/functions/send-message-email/index.ts supabase/functions/deno.json; git commit -m "fix: upgrade runtime router and pin edge imports"`.**

### Task 7: Full verification

**Files:** Modify only when verification exposes a regression.

- [ ] **Step 1: Run `npx vitest run --no-file-parallelism`.**
- [ ] **Step 2: Run `npm run lint`, `npm run build`, and `rg -n 'select\\("\\*"\\)|VITE_.*(SECRET|SERVICE|TOKEN|PASSWORD)' src supabase`; expected no client wildcard selects or exposed service credentials.**
- [ ] **Step 3: Run `git diff --check HEAD~7..HEAD`, inspect `git status --short`, and verify unrelated existing changes remain untouched.**
- [ ] **Step 4: Write the deployment handoff listing migrations, Edge Functions, required secrets, and separately authorized rollout commands.**
