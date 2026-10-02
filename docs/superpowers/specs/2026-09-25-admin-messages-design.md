# Admin-to-User Messages with Email Notification — Design

## Context

The user wants a way for the app's admin/staff to send a user a message (e.g. "your refund is being processed," "we need an additional document for your 2025 filing"), with an automatic email notification to that user's email on file.

Investigation of the existing codebase found there is currently **zero** infrastructure for any of this:

- **No admin role or admin UI anywhere.** Staff already update `declarations.status` (`processing`/`audit_request`/`approved`) by hand in Supabase, since no in-app path exists for it — the same pattern this feature will follow.
- **No email-sending capability beyond Supabase Auth's own built-in transactional emails** (signup confirmation, password reset). Nothing in `package.json` or the source references an email provider.
- **No notifications/inbox UI.** The closest existing analog, the `activities` table (`src/lib/activity-log.ts`), is a same-user, self-authored audit trail embedded per-declaration in `SubmissionDetail.tsx` — never a cross-declaration feed, and never written by anyone but the row's own owner.
- **Every existing RLS policy in this schema is `auth.uid() = <owner column>`**, with no exceptions (`supabase/migrations/20260924000000_initial_schema.sql:4-6` says this explicitly). A `messages` table is the first case in this app where one party (staff, via direct DB access) writes a row that a *different* party (the recipient user) must read.
- **No `supabase/functions/` directory** — any Edge Function work here is greenfield.

**Scope, confirmed with the user across three decisions:**
- **No in-app admin UI.** Staff insert a row into the new `messages` table directly via Supabase Studio (the same way they already handle declaration status changes) — the app's job is only to store the message, show it to the recipient, and trigger the email. This also settles the RLS question: since inserts happen through the privileged Studio connection (which bypasses RLS), the table needs no `INSERT` policy at all for the `authenticated` role.
- **Resend** for email delivery.
- Messages **optionally** link to a declaration (nullable FK), shown with filing context when present.
- A **new bottom-nav tab** ("Messages"), not folded into the Dashboard.

**Explicitly out of scope:** a full admin UI, two-way replies/conversations, email retry/queueing on failure, push notifications (email only), un-reading a message, deleting messages, rich text or attachments in message bodies, custom email template theming beyond a simple fixed layout.

## Data model

New migration `supabase/migrations/20260925000000_messages.sql`:

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  declaration_id uuid references public.declarations(id) on delete set null,
  category text not null check (category in ('refund_status', 'document_request', 'general')) default 'general',
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "users can view their own messages"
  on public.messages for select
  using (auth.uid() = recipient_user_id);

-- Recipients may mark a message read, but must not be able to rewrite its
-- subject/body/category — a full-row UPDATE policy can't express that
-- distinction, so this uses a column-level grant instead, restricting what
-- an authenticated user's UPDATE can touch, combined with the row-scoping
-- USING/WITH CHECK below.
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "users can mark their own messages read"
  on public.messages for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

-- No INSERT or DELETE policy for `authenticated` at all: messages are
-- created only via direct Supabase Studio access (the same privileged
-- connection staff already use to change declaration status by hand),
-- which runs as the table owner and bypasses RLS entirely.
```

`category` mirrors the existing `activities.type` pattern (`src/lib/local-db.ts`'s `ActivityType`) — it drives which icon/color the message gets in the UI, the same way activity entries already do in `SubmissionDetail.tsx`'s Activity Timeline.

`declaration_id` is nullable and `on delete set null` (not `cascade`): if a declaration is later deleted, a message that referenced it should degrade to a general message, not disappear.

## Local storage & sync

Following the app's existing local-first pattern (mirrors `declarations`/`activities`, not a new architecture):

**`src/lib/local-db.ts`**: add a `LocalMessage` interface and a `messages` table, Dexie version bump (v8 → v9). Encrypted fields: `subject`, `body` (PII-adjacent — a message could contain a tax ID or address), following the same `applyFieldEncryption` pattern already used for `profiles`/`declarations`. `category`, `declarationId`, `readAt`, `createdAt` stay plaintext/indexed (needed for sorting and unread-count queries, same reasoning as `profiles.country` or `declarations.status` staying unindexed-but-unencrypted today).

**`src/lib/api.ts`**: add `fetchMessagesFromServer(): Promise<LocalMessage[]>` (pull, scoped `.eq("recipient_user_id", userId)`) and `pushMessageReadStatus(messageId: string): Promise<void>` (writes only `read_at`, matching the column-grant restriction above).

**`src/lib/sync-service.ts`**: `syncAll()` gains a pull step for messages (write-through via `db.messages.put(...)` for each server row, same pattern as declarations) and a push step for any locally-marked-read message with `pendingSync: 1` not yet pushed — same `pendingSync` convention as `declarations`/`activities`.

**`src/hooks/use-local-data.ts`**: add `useMessages(): LocalMessage[]` (all messages, newest first) and `useUnreadMessageCount(): number` (live Dexie count where `readAt` is undefined), following the exact shape of the existing `useDeclarations`/`useActivities` hooks in this same file.

## Email delivery

**Supabase Database Webhook** on `messages` `INSERT` → Edge Function `supabase/functions/send-message-email/index.ts`. This is the only viable trigger point given the scope decision above: since messages are inserted directly via Studio (no app code runs on creation), the trigger has to live at the database level, not in any client code path.

The function:
1. Reads the inserted row from the webhook payload (`record.recipient_user_id`, `subject`, `body`, `category`, `declaration_id`).
2. Looks up the recipient's email via the Supabase admin client (`supabase.auth.admin.getUserById()`), since the function runs with the service-role key.
3. Sends via Resend's API with a simple fixed template (subject line = message subject, body = message body, a link back to the app's `/messages` route).
4. On failure, logs the error (Edge Function logs) and returns a non-2xx response, but does **not** retry and does **not** roll back or affect the already-saved `messages` row — the row exists and is visible in-app regardless of whether the email succeeded.

**Setup this requires from the user, outside this codebase** (not something I can do from here — flagging explicitly rather than assuming): a Resend account and API key (stored as an Edge Function secret, `RESEND_API_KEY`), and a decision on the sending address — either a verified domain or Resend's shared sandbox sender, whichever Resend's current account restrictions allow. This gets resolved during implementation/setup, not assumed here.

## UI

**New page `src/pages/Messages.tsx`**: card-list of messages (same visual pattern as `Submissions.tsx`/`SubmissionCard.tsx` — leading icon-in-colored-badge keyed by `category`, bold subject line, muted preview/date, unread messages visually distinguished e.g. a dot or bold weight). Tapping a message expands it (inline or a dialog — implementation detail, not a new route, to keep this from becoming a second full page) and marks it read via `pushMessageReadStatus`. Empty state: centered muted text, matching the "No submissions found." / "No activity recorded yet." convention already used elsewhere.

**`src/App.tsx`**: new `/messages` route in the authenticated route table.

**`src/components/layout/BottomNav.tsx`**: sixth nav item ("Messages", an inbox/mail-type icon from `lucide-react`), with an unread-count badge (shadcn `Badge`, already present in `src/components/ui/badge.tsx`) driven by `useUnreadMessageCount()`. Six icons in the existing `justify-around` row will be visibly tighter on a phone screen than today's five — a small padding adjustment (`px-3` → `px-2` or similar) is expected and in scope for this change, not a separate redesign.

## Error handling

- Email send failure: logged server-side only, never surfaces to the user (the message is already saved and visible regardless) — see Email delivery §4 above.
- A message with a `declaration_id` pointing at a declaration the user no longer has locally (e.g. synced order, or a data edge case): the UI shows the message without the filing-context line rather than erroring, mirroring how `SubmissionDetail.tsx` already treats missing/optional data defensively.
- Marking read while offline: writes locally with `pendingSync: 1` immediately (optimistic, same as every other local-first write in this app) and pushes on the next successful sync.

## Testing

- New migration: no automated test harness exists for SQL migrations in this repo today (confirmed — none of the three existing migrations have one); this one follows the same precedent, verified manually against a local/staging Supabase instance during implementation.
- `api.ts`/`sync-service.ts` new functions: unit tests following the exact existing patterns for `fetchDeclarationsFromServer`/`pushDeclarationsToServer` etc.
- `use-local-data.ts`'s new hooks: no existing test file for this hook module today (confirmed) — new tests added for `useMessages`/`useUnreadMessageCount` establish the first coverage for this file, using the same real-Dexie-with-fake-indexeddb pattern already established in `local-db.test.ts`.
- `Messages.tsx`: rendered/interaction tests (empty state, unread indicator, mark-as-read on open) following the existing page-test conventions (e.g. `Submissions.test.tsx` if one exists, else the general RTL pattern used throughout `src/pages/*.test.tsx`).
- `BottomNav.tsx`: existing coverage (if any) extended for the sixth item and badge; if none exists today, a new minimal test isn't required to be added here to avoid inventing test scope this repo hasn't established for that specific file — actual coverage decision confirmed during plan-writing, once existing `BottomNav` test coverage (if any) is verified.
- The Edge Function itself: no Deno/Edge Function test convention exists in this repo (it's greenfield). Verified manually via `supabase functions serve` during implementation/setup, not as part of the automated `vitest` suite — this is a deliberate scope boundary, not an oversight, since this codebase's test tooling (Vitest/jsdom) doesn't run Deno Edge Functions.
