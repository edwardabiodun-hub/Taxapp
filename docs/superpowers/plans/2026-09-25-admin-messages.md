# Admin-to-User Messages with Email Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff send a user a message (refund status, document requests, etc.) by inserting a row directly in Supabase, have it appear in a new in-app inbox, and trigger an email to the user's address on file.

**Architecture:** A new `messages` table (first table in this schema where one party writes a row a different party reads — no `INSERT`/`DELETE` RLS policy for `authenticated` at all, since rows are only ever created via direct privileged Supabase access, never through the app). The app follows its existing local-first pattern end to end: pull-only sync into a new Dexie `messages` table, a new `/messages` page and bottom-nav tab, and a `read_at`-only push path (column-grant restricted) when the user opens a message. A Supabase Database Webhook on `messages` `INSERT` calls a new Edge Function that emails the recipient via Resend — the only viable trigger point, since no app code runs when staff insert a row directly.

**Tech Stack:** React + TypeScript, Vite, Dexie (IndexedDB), Supabase (Postgres + Auth + Edge Functions), Resend, Vitest + Testing Library.

**Spec:** [docs/superpowers/specs/2026-09-25-admin-messages-design.md](../specs/2026-09-25-admin-messages-design.md)

## Global Constraints

- No in-app admin UI, and no `INSERT`/`DELETE` RLS policy on `messages` for the `authenticated` role — messages are only ever created via direct Supabase access outside this app.
- Recipients may update only the `read_at` column on their own message rows (a column-level grant restricting `UPDATE`, not a blanket row policy) — `subject`/`body`/`category` must never be client-writable.
- `category` is one of exactly `refund_status` | `document_request` | `general`.
- `declaration_id` is nullable, `on delete set null` (never `cascade`) — a message must survive its linked declaration being deleted.
- An email send failure must never block, roll back, or delay the user seeing the message in-app — the row is committed before the webhook fires, and the webhook's own failure is independent of it.
- Out of scope (do not build): a full admin UI, two-way replies, retry/queueing for failed emails, push notifications, un-reading a message, deleting a message, rich text or attachments.

## Review Focus

- A message with no `declaration_id` (a general, non-filing-specific message) must render cleanly with no filing-context line and no crash — not every message links to a declaration.
- A `category` value the client doesn't recognize (e.g. a category added server-side before the app updates) must fall back to a sane default rendering, not throw on an undefined lookup.
- Marking a message read while offline, then syncing later, must update the existing local row in place — never insert a second row for the same message id.
- The Edge Function receiving a malformed or incomplete webhook payload must respond with a clear error, not crash unhandled (no automated test exists for this file — this is a manual-review item for whoever reviews Task 8).
- The unread-count badge must recompute correctly after multiple messages are marked read in a session, not just after the first one.

---

## Task 1: `messages` table and RLS

**Files:**
- Create: `supabase/migrations/20260925000000_messages.sql`

**Interfaces:**
- Produces: the `public.messages` table (`id`, `recipient_user_id`, `declaration_id`, `category`, `subject`, `body`, `read_at`, `created_at`), consumed by every later task's server-facing code (`api.ts`'s `fetchMessagesFromServer`/`pushMessageReadStatus`, and the Edge Function in Task 8).

This task has no automated test — no migration in this repo has one (confirmed: none of the three existing migration files does), so there is no test harness to extend. Verification here is manual, against a real Supabase instance, per the steps below.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260925000000_messages.sql`:

```sql
-- Admin-to-user messages, with an outbound email notification triggered by
-- a Supabase Database Webhook on INSERT (configured manually after this
-- migration is applied — see Task 8's setup instructions; it is not part
-- of this SQL file since it needs the deployed Edge Function's own URL).
--
-- Unlike every other table in this schema, a message is written by a
-- second party (staff) to a row a different user reads. Staff insert rows
-- directly via the Supabase Studio SQL editor — the same privileged
-- connection already used to change declarations.status by hand — which
-- bypasses RLS entirely. This table intentionally has no INSERT or DELETE
-- policy for the `authenticated` role at all.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  declaration_id uuid references public.declarations(id) on delete set null,
  category text not null default 'general'
    check (category in ('refund_status', 'document_request', 'general')),
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "select own messages" on public.messages
  for select using (auth.uid() = recipient_user_id);

-- Recipients may mark a message read, but must not be able to rewrite its
-- subject/body/category. RLS policies scope which ROWS are touched, not
-- which columns — restricting to read_at needs a column-level grant. This
-- revokes the broad UPDATE the authenticated role has by default on every
-- public table (Supabase's project-wide default privileges), then grants
-- it back for read_at only. The policy below still scopes which rows.
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "update own message read status" on public.messages
  for update using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

create index messages_recipient_user_id_idx on public.messages (recipient_user_id);
create index messages_declaration_id_idx on public.messages (declaration_id);
```

- [ ] **Step 2: Verify the SQL applies cleanly**

Run this migration against a real Supabase instance (the project's Supabase Studio SQL editor, or `supabase db push` if the CLI is linked — the CLI is not currently linked in this worktree, so the SQL editor is the practical path unless that changes before this task runs). Confirm:
- The `messages` table and both indexes exist.
- `select * from pg_policies where tablename = 'messages';` shows exactly two policies: `select own messages` and `update own message read status`.
- As the `postgres`/service-role connection (which bypasses RLS): `insert into public.messages (recipient_user_id, category, subject, body) values ('<any real auth.users id>', 'general', 'Test', 'Test body');` succeeds.
- As an authenticated client for a *different* user than the row's `recipient_user_id`: `select * from public.messages;` returns zero rows (RLS is working).
- As the authenticated client for the actual recipient: `select * from public.messages;` returns the row, and `update public.messages set read_at = now() where id = '<the row's id>';` succeeds, but `update public.messages set subject = 'tampered' where id = '<the row's id>';` fails (column-grant is working).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260925000000_messages.sql
git commit -m "feat: add messages table with recipient-only RLS"
```

---

## Task 2: Local storage — `LocalMessage`, Dexie schema, encryption

**Files:**
- Modify: `src/lib/local-db.ts`
- Test: `src/lib/local-db.test.ts`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces: exported `LocalMessage` interface (`id: string; declarationId?: string; category: "refund_status" | "document_request" | "general"; subject: string; body: string; readAt?: string; createdAt: string; pendingSync: 0 | 1;`), and `db.messages: Table<LocalMessage, string>` — consumed by Task 3 (`api.ts`), Task 5 (`use-local-data.ts`), Task 6 (`Messages.tsx`), and Task 7 (`BottomNav.tsx`, via Task 5's hook).

Note: `LocalMessage` deliberately has no `recipientUserId` field — no existing local table stores the owning user's id either (`LocalDeclaration` and `LocalActivity` don't), since every local row implicitly belongs to "this device's signed-in user."

Note: `readAt` is **not** part of the Dexie index string below. IndexedDB never indexes a missing/`undefined` field (the same reason `pendingSync` uses `0 | 1` instead of a boolean, per the existing comment on `LocalDeclaration.pendingSync`), so an index on `readAt` would be useless for an "is this unread" query anyway. The unread count (Task 5) uses `.filter()` over the table instead — fine at this data scale (one user's own messages).

- [ ] **Step 1: Write the failing test**

Add to `src/lib/local-db.test.ts`, a new helper function (alongside the existing `readRawProfile`) and a new test inside the existing `describe` block:

```ts
async function readRawMessage(id: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open("TaxEaseAfrica");
    openReq.onsuccess = () => {
      const idb = openReq.result;
      const tx = idb.transaction("messages", "readonly");
      const getReq = tx.objectStore("messages").get(id);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}
```

```ts
  it("encrypts message subject/body at rest but leaves category/pendingSync plaintext and queryable", async () => {
    const { db } = await import("./local-db");

    await db.messages.put({
      id: "msg-test-1",
      category: "refund_status",
      subject: "Your refund is on its way",
      body: "We've approved your 2025 refund of NGN 45,200.",
      createdAt: new Date().toISOString(),
      pendingSync: 0,
    });

    const raw = await readRawMessage("msg-test-1");
    expect(raw.subject).toMatch(/^enc:v1:/);
    expect(raw.body).toMatch(/^enc:v1:/);
    expect(raw.category).toBe("refund_status");
    expect(raw.pendingSync).toBe(0);

    const decrypted = await db.messages.get("msg-test-1");
    expect(decrypted?.subject).toBe("Your refund is on its way");
    expect(decrypted?.body).toBe("We've approved your 2025 refund of NGN 45,200.");
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/local-db.test.ts`
Expected: FAIL — `db.messages` doesn't exist yet (`Table not found` or similar Dexie error).

- [ ] **Step 3: Implement**

In `src/lib/local-db.ts`, add the `LocalMessage` interface after `LocalActivity`:

```ts
export interface LocalMessage {
  id: string;
  /** References a declarations row — absent for a general, non-filing
   * message. Set null server-side (not deleted) if the linked declaration
   * is later removed; see the messages migration's `on delete set null`. */
  declarationId?: string;
  category: "refund_status" | "document_request" | "general";
  subject: string;
  body: string;
  /** ISO timestamp of when the recipient opened this message; undefined
   * means unread. Never cleared once set — "un-reading" a message isn't
   * supported. */
  readAt?: string;
  createdAt: string;
  /** 0 | 1, not boolean — see LocalDeclaration.pendingSync for why this
   * codebase always uses 0/1 for an IndexedDB-indexed flag. 0 until the
   * user marks the message read locally; set to 1 at that point so
   * sync-service pushes just the read_at change, then cleared back to 0
   * once pushed. */
  pendingSync: 0 | 1;
}
```

Add `messages` to the `TaxEaseDB` class's table declarations:

```ts
  messages!: Table<LocalMessage, string>;
```

Add `messages: ["subject", "body"]` to the `applyFieldEncryption` call's config object (alongside the existing `profiles`/`declarations` entries):

```ts
    applyFieldEncryption(this, getOrCreateDbKey(), {
      profiles: [
        "name",
        "email",
        "phone",
        "taxId",
        "dateOfBirth",
        "countryOfBirth",
        "gender",
        "nationality",
      ],
      declarations: ["formData", "amount"],
      messages: ["subject", "body"],
    });
```

Add a new `version(9)` block after the existing `version(8)` block:

```ts
    // v8 -> v9: added `messages` — admin-to-user notifications (refund
    // status updates, requests for additional documents), pulled from the
    // server; see api.ts's fetchMessagesFromServer/pushMessageReadStatus
    // and sync-service.ts. `readAt` isn't indexed (see the LocalMessage
    // doc comment) — the unread count filters the table directly instead.
    this.version(9).stores({
      profiles: "id, country",
      declarations: "id, taxYear, country, status, pendingSync, createdAt",
      documentFiles: "id, declarationId",
      auth: null,
      referenceData: "key",
      activities: "id, declarationId, timestamp, pendingSync",
      messages: "id, declarationId, pendingSync, createdAt",
    });
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/local-db.test.ts`
Expected: PASS — all `local-db.test.ts` tests (the two existing ones plus the new one) green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/local-db.ts src/lib/local-db.test.ts
git commit -m "feat: add LocalMessage type and messages Dexie table"
```

---

## Task 3: `api.ts` — fetch and push-read-status

**Files:**
- Modify: `src/lib/api.ts`
- Test: `src/lib/api.test.ts`

**Interfaces:**
- Consumes: `LocalMessage` type from Task 2's `src/lib/local-db.ts`.
- Produces: `fetchMessagesFromServer(): Promise<LocalMessage[]>` and `pushMessageReadStatus(id: string, readAt: string): Promise<void>` — consumed by Task 4 (`sync-service.ts`).

- [ ] **Step 1: Write the failing tests**

Update the type import at the top of `src/lib/api.test.ts` is not needed (the test file doesn't import `LocalMessage` directly — it asserts against plain object literals, matching the existing style for `fetchProfileFromServer`/`fetchDeclarationsFromServer` tests). Add these new `describe` blocks to `src/lib/api.test.ts`, inside the existing top-level `describe("api", ...)` block:

```ts
  describe("fetchMessagesFromServer", () => {
    it("maps message rows to LocalMessage shape", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "msg-1",
              declaration_id: "decl-1",
              category: "refund_status",
              subject: "Your refund is on its way",
              body: "We've approved your 2025 refund.",
              read_at: null,
              created_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchMessagesFromServer } = await import("./api");
      const messages = await fetchMessagesFromServer();

      expect(messages).toEqual([
        {
          id: "msg-1",
          declarationId: "decl-1",
          category: "refund_status",
          subject: "Your refund is on its way",
          body: "We've approved your 2025 refund.",
          readAt: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          pendingSync: 0,
        },
      ]);
    });

    it("leaves declarationId undefined for a general message with no linked filing, and maps a present read_at", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "msg-2",
              declaration_id: null,
              category: "general",
              subject: "Welcome to FileSmart",
              body: "Thanks for signing up.",
              read_at: "2026-01-02T00:00:00.000Z",
              created_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchMessagesFromServer } = await import("./api");
      const messages = await fetchMessagesFromServer();

      expect(messages[0].declarationId).toBeUndefined();
      expect(messages[0].readAt).toBe("2026-01-02T00:00:00.000Z");
    });

    it("scopes the query to the current user", async () => {
      const builder = makeQueryBuilder({ data: [], error: null });
      fromMock.mockReturnValue(builder);

      const { fetchMessagesFromServer } = await import("./api");
      await fetchMessagesFromServer();

      expect(fromMock).toHaveBeenCalledWith("messages");
      expect(builder.eq).toHaveBeenCalledWith("recipient_user_id", "user-uuid-1");
    });
  });

  describe("pushMessageReadStatus", () => {
    it("updates only read_at for the given message id", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pushMessageReadStatus } = await import("./api");
      await pushMessageReadStatus("msg-1", "2026-01-03T00:00:00.000Z");

      expect(builder.update).toHaveBeenCalledWith({ read_at: "2026-01-03T00:00:00.000Z" });
      expect(builder.eq).toHaveBeenCalledWith("id", "msg-1");
    });

    it("throws when the server rejects the update", async () => {
      fromMock.mockReturnValue(makeQueryBuilder({ data: null, error: { message: "permission denied" } }));

      const { pushMessageReadStatus } = await import("./api");

      await expect(pushMessageReadStatus("msg-1", "2026-01-03T00:00:00.000Z")).rejects.toBeTruthy();
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — `fetchMessagesFromServer`/`pushMessageReadStatus` are not exported from `./api`.

- [ ] **Step 3: Implement**

In `src/lib/api.ts`, update the type import at the top of the file:

```ts
import type { LocalActivity, LocalDeclaration, LocalMessage, LocalProfile } from "./local-db";
```

Add to the end of the file:

```ts
// ── Messages ─────────────────────────────────────────────

interface MessageRow {
  id: string;
  declaration_id: string | null;
  category: LocalMessage["category"];
  subject: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export async function fetchMessagesFromServer(): Promise<LocalMessage[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("recipient_user_id", userId)
    .returns<MessageRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    declarationId: row.declaration_id ?? undefined,
    category: row.category,
    subject: row.subject,
    body: row.body,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
    pendingSync: 0,
  }));
}

/** Pushes only the read_at change for one message. The server's column
 * grant (see the messages migration) rejects anything beyond read_at, so
 * this intentionally sends nothing else — no need to also scope by user
 * id here, since RLS already restricts which row this can touch. */
export async function pushMessageReadStatus(id: string, readAt: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ read_at: readAt }).eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS — all `api.test.ts` tests (existing plus the five new ones) green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/api.test.ts
git commit -m "feat: add fetchMessagesFromServer and pushMessageReadStatus"
```

---

## Task 4: Wire messages into `syncAll()`

**Files:**
- Modify: `src/lib/sync-service.ts`
- Test: `src/lib/sync-service.test.ts`

**Interfaces:**
- Consumes: `fetchMessagesFromServer`, `pushMessageReadStatus` from Task 3's `src/lib/api.ts`.
- Produces: `syncAll()` now also pulls messages into `db.messages` and pushes any locally-marked-read message not yet synced. No new exports — same `syncAll(): Promise<SyncResult>` signature.

- [ ] **Step 1: Write the failing tests**

Update the `vi.mock("./api", ...)` block at the top of `src/lib/sync-service.test.ts` to add the two new mocked functions:

```ts
vi.mock("./api", () => ({
  fetchProfileFromServer: vi.fn(),
  pushProfileToServer: vi.fn(async () => {}),
  fetchDeclarationsFromServer: vi.fn(async () => []),
  pushDeclarationsToServer: vi.fn(async () => {}),
  fetchActivitiesFromServer: vi.fn(async () => []),
  pushActivitiesToServer: vi.fn(async () => {}),
  fetchMessagesFromServer: vi.fn(async () => []),
  pushMessageReadStatus: vi.fn(async () => {}),
}));
```

Add these two tests inside the existing `describe("syncAll", ...)` block:

```ts
  it("pushes a pending read-status change and clears pendingSync", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.messages.put({
      id: "msg-pending",
      category: "general",
      subject: "Welcome",
      body: "Thanks for signing up.",
      readAt: "2026-01-05T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 1,
    });

    await syncAll();

    expect(api.pushMessageReadStatus).toHaveBeenCalledWith("msg-pending", "2026-01-05T00:00:00.000Z");
    const after = await db.messages.get("msg-pending");
    expect(after?.pendingSync).toBe(0);
  });

  it("pulls messages from the server into local storage, updating an existing row rather than duplicating it", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.messages.put({
      id: "msg-existing",
      category: "general",
      subject: "Old subject",
      body: "Old body",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    vi.mocked(api.fetchMessagesFromServer).mockResolvedValue([
      {
        id: "msg-existing",
        category: "document_request",
        subject: "We need a document from you",
        body: "Please upload your payslip.",
        createdAt: "2026-01-01T00:00:00.000Z",
        pendingSync: 0,
      },
    ]);

    await syncAll();

    expect(await db.messages.count()).toBe(1);
    const stored = await db.messages.get("msg-existing");
    expect(stored?.subject).toBe("We need a document from you");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/sync-service.test.ts`
Expected: FAIL — `db.messages` isn't touched by `syncAll()` yet, so the push assertion finds no call and the pull test's row is never updated.

- [ ] **Step 3: Implement**

In `src/lib/sync-service.ts`, update the import from `./api`:

```ts
import {
  fetchProfileFromServer,
  pushProfileToServer,
  fetchDeclarationsFromServer,
  pushDeclarationsToServer,
  fetchActivitiesFromServer,
  pushActivitiesToServer,
  fetchMessagesFromServer,
  pushMessageReadStatus,
} from "./api";
```

Add a push step after the existing activities push block (after the `pendingActivities` loop, before `// ── Pull from server ──`):

```ts
    // Messages are read-only from the server's perspective except for
    // read_at, which only ever moves unread -> read and never back (see
    // LocalMessage's own doc comment) — so there's no edit-during-push race
    // to guard against here, the same reasoning activities' pendingSync
    // clearing above already relies on.
    const pendingMessages = await db.messages.where("pendingSync").equals(1).toArray();
    for (const message of pendingMessages) {
      if (message.readAt) {
        await pushMessageReadStatus(message.id, message.readAt);
      }
      await db.messages.update(message.id, { pendingSync: 0 });
    }
```

Update the `Promise.all` pull block to also fetch messages:

```ts
    const [serverProfile, serverDeclarations, serverActivities, serverMessages] = await Promise.all([
      fetchProfileFromServer(),
      fetchDeclarationsFromServer(),
      fetchActivitiesFromServer(),
      fetchMessagesFromServer(),
    ]);
```

Add a pull-write loop after the existing `for (const activity of serverActivities) { await db.activities.put(activity); }` loop:

```ts
    for (const message of serverMessages) {
      await db.messages.put(message);
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/sync-service.test.ts`
Expected: PASS — all `sync-service.test.ts` tests (existing three plus the two new ones) green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync-service.ts src/lib/sync-service.test.ts
git commit -m "feat: sync messages in syncAll()"
```

---

## Task 5: `useMessages` and `useUnreadMessageCount` hooks

**Files:**
- Modify: `src/hooks/use-local-data.ts`
- Test: `src/hooks/use-local-data.test.ts` (new — no test file exists for this hook module today)

**Interfaces:**
- Consumes: `LocalMessage` type and `db.messages` from Task 2's `src/lib/local-db.ts`.
- Produces: `useMessages(): LocalMessage[]` (newest first) and `useUnreadMessageCount(): number` — consumed by Task 6 (`Messages.tsx`) and Task 7 (`BottomNav.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/use-local-data.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

describe("useMessages", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("returns messages newest first", async () => {
    const { db } = await import("@/lib/local-db");
    const { useMessages } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-old",
      category: "general",
      subject: "Older",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-new",
      category: "general",
      subject: "Newer",
      body: "b",
      createdAt: "2026-01-02T00:00:00.000Z",
      pendingSync: 0,
    });

    const { result } = renderHook(() => useMessages());

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current[0].id).toBe("msg-new");
    expect(result.current[1].id).toBe("msg-old");
  });
});

describe("useUnreadMessageCount", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("counts only messages with no readAt", async () => {
    const { db } = await import("@/lib/local-db");
    const { useUnreadMessageCount } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-unread",
      category: "general",
      subject: "Unread",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-read",
      category: "general",
      subject: "Read",
      body: "b",
      readAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    const { result } = renderHook(() => useUnreadMessageCount());

    await waitFor(() => expect(result.current).toBe(1));
  });

  it("recomputes after a second message is marked read", async () => {
    const { db } = await import("@/lib/local-db");
    const { useUnreadMessageCount } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2", category: "general", subject: "Two", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { result } = renderHook(() => useUnreadMessageCount());
    await waitFor(() => expect(result.current).toBe(2));

    await db.messages.update("msg-1", { readAt: "2026-01-03T00:00:00.000Z", pendingSync: 1 });
    await waitFor(() => expect(result.current).toBe(1));

    await db.messages.update("msg-2", { readAt: "2026-01-03T00:00:00.000Z", pendingSync: 1 });
    await waitFor(() => expect(result.current).toBe(0));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/hooks/use-local-data.test.ts`
Expected: FAIL — `useMessages`/`useUnreadMessageCount` are not exported from `./use-local-data`.

- [ ] **Step 3: Implement**

In `src/hooks/use-local-data.ts`, update the type import:

```ts
import { db, type LocalActivity, type LocalDeclaration, type LocalMessage, type LocalProfile } from "@/lib/local-db";
```

Add to the end of the file:

```ts
export function useMessages(): LocalMessage[] {
  return useLiveQuery(() => db.messages.orderBy("createdAt").reverse().toArray()) ?? [];
}

export function useUnreadMessageCount(): number {
  return useLiveQuery(() => db.messages.filter((m) => m.readAt == null).count()) ?? 0;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/hooks/use-local-data.test.ts`
Expected: PASS — all 3 new tests green.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-local-data.ts src/hooks/use-local-data.test.ts
git commit -m "feat: add useMessages and useUnreadMessageCount hooks"
```

---

## Task 6: Messages page and route

**Files:**
- Create: `src/pages/Messages.tsx`
- Create: `src/pages/Messages.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useMessages` from Task 5's `src/hooks/use-local-data.ts`; `useDeclarations` (existing, from the same file); `db` and `LocalMessage` from Task 2's `src/lib/local-db.ts`.
- Produces: default-exported `Messages` component, no props, mounted at `/messages`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/Messages.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("Messages", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
    await db.declarations.clear();
  });

  it("shows an empty state when there are no messages", async () => {
    const { default: Messages } = await import("./Messages");
    render(<Messages />);

    await waitFor(() => expect(screen.getByText(/no messages yet/i)).toBeInTheDocument());
  });

  it("marks a message read and reveals its body when tapped", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.messages.put({
      id: "msg-1",
      category: "document_request",
      subject: "We need a document from you",
      body: "Please upload your payslip for 2025.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);
    await waitFor(() => expect(screen.getByText("We need a document from you")).toBeInTheDocument());

    fireEvent.click(screen.getByText("We need a document from you"));

    await waitFor(() => expect(screen.getByText("Please upload your payslip for 2025.")).toBeInTheDocument());
    await waitFor(async () => {
      const stored = await db.messages.get("msg-1");
      expect(stored?.readAt).toBeDefined();
      expect(stored?.pendingSync).toBe(1);
    });
  });

  it("shows the linked declaration's context when a message references one", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.declarations.put({
      id: "decl-1",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "processing",
      formData: {},
      documents: [],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2",
      declarationId: "decl-1",
      category: "refund_status",
      subject: "Your refund is on its way",
      body: "We've approved your refund.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText(/re: income tax — 2025/i)).toBeInTheDocument());
  });

  it("shows no filing-context line for a general message with no linked declaration", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    await db.messages.put({
      id: "msg-3",
      category: "general",
      subject: "Welcome to FileSmart",
      body: "Thanks for signing up.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText("Welcome to FileSmart")).toBeInTheDocument());
    expect(screen.queryByText(/^re:/i)).not.toBeInTheDocument();
  });

  it("falls back to a default rendering for an unrecognized category instead of crashing", async () => {
    const { db } = await import("@/lib/local-db");
    const { default: Messages } = await import("./Messages");

    // Cast bypasses the LocalMessage type on purpose — this simulates a
    // category value the server added after this client shipped.
    await db.messages.put({
      id: "msg-4",
      category: "future_category" as never,
      subject: "A brand new kind of message",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    render(<Messages />);

    await waitFor(() => expect(screen.getByText("A brand new kind of message")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/Messages.test.tsx`
Expected: FAIL — `src/pages/Messages.tsx` doesn't exist.

- [ ] **Step 3: Implement Messages.tsx**

Create `src/pages/Messages.tsx`:

```tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Wallet, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, useDeclarations } from "@/hooks/use-local-data";
import { db, type LocalMessage } from "@/lib/local-db";

const categoryConfig: Record<string, { icon: typeof Mail; className: string }> = {
  refund_status: { icon: Wallet, className: "bg-success/10 text-success" },
  document_request: { icon: FileWarning, className: "bg-warning/10 text-warning" },
  general: { icon: Mail, className: "bg-info/10 text-info" },
};

async function markRead(message: LocalMessage) {
  if (message.readAt) return;
  await db.messages.update(message.id, { readAt: new Date().toISOString(), pendingSync: 1 });
}

const Messages = () => {
  const messages = useMessages();
  const declarations = useDeclarations();
  const [expandedId, setExpandedId] = useState<string>();

  const handleToggle = (message: LocalMessage) => {
    setExpandedId((current) => (current === message.id ? undefined : message.id));
    markRead(message);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-6 max-w-lg mx-auto space-y-2"
    >
      {messages.length === 0 && (
        <p className="text-center text-muted-foreground py-12 text-sm">No messages yet.</p>
      )}
      {messages.map((message, i) => {
        const config = categoryConfig[message.category] ?? categoryConfig.general;
        const Icon = config.icon;
        const isExpanded = expandedId === message.id;
        const isUnread = !message.readAt;
        const linkedDeclaration = message.declarationId
          ? declarations.find((d) => d.id === message.declarationId)
          : undefined;

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => handleToggle(message)}
              className="w-full flex items-start gap-3 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all text-left"
            >
              <div className={cn("p-2 rounded-lg shrink-0", config.className)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isUnread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
                  )}
                  <p
                    className={cn(
                      "text-sm truncate",
                      isUnread ? "font-semibold text-card-foreground" : "font-medium text-muted-foreground"
                    )}
                  >
                    {message.subject}
                  </p>
                </div>
                {linkedDeclaration && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re: {linkedDeclaration.type} — {linkedDeclaration.taxYear}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(message.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {isExpanded && (
                  <p className="text-sm text-card-foreground mt-2 whitespace-pre-wrap">{message.body}</p>
                )}
              </div>
            </button>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default Messages;
```

Then, in `src/App.tsx`: add `import Messages from "./pages/Messages";` alongside the other page imports, and add `<Route path="/messages" element={<Messages />} />` inside the authenticated route table's `<Route element={<AppLayout />}>` block (alongside `/`, `/declare`, `/submissions`, etc.).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/Messages.test.tsx`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Run the full suite once**

Run: `npx vitest run --no-file-parallelism`
Expected: PASS — no regressions from the `App.tsx` route addition.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Messages.tsx src/pages/Messages.test.tsx src/App.tsx
git commit -m "feat: add Messages page and /messages route"
```

---

## Task 7: Bottom nav tab and unread badge

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`
- Test: `src/components/layout/BottomNav.test.tsx` (new — no test file exists for this component today; this covers only the new behavior this task adds)

**Interfaces:**
- Consumes: `useUnreadMessageCount` from Task 5's `src/hooks/use-local-data.ts`; `Badge` from the existing `src/components/ui/badge.tsx`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/layout/BottomNav.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

describe("BottomNav", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("links to /messages as a nav item", async () => {
    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /messages/i })).toHaveAttribute("href", "/messages");
  });

  it("shows an unread-count badge matching the number of unread messages", async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2", category: "general", subject: "Two", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("shows no badge when every message is read", async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      readAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toBeInTheDocument());
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/layout/BottomNav.test.tsx`
Expected: FAIL — no `/messages` link exists in `BottomNav` yet.

- [ ] **Step 3: Implement**

Replace `src/components/layout/BottomNav.tsx` with:

```tsx
import { NavLink, useLocation } from "react-router-dom";
import { Home, FilePlus, Calculator, FileText, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessageCount } from "@/hooks/use-local-data";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/declare", icon: FilePlus, label: "Declare" },
  { to: "/calculator", icon: Calculator, label: "Estimate" },
  { to: "/submissions", icon: FileText, label: "History" },
  { to: "/messages", icon: Mail, label: "Messages" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const unreadCount = useUnreadMessageCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-0.5 px-2 py-1 group"
            >
              <div
                className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-200",
                  isActive ? "bg-[var(--primary-tint)]" : "group-hover:bg-muted"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {item.to === "/messages" && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] leading-none"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/layout/BottomNav.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Run the full suite once**

Run: `npx vitest run --no-file-parallelism`
Expected: PASS — no regressions.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/BottomNav.tsx src/components/layout/BottomNav.test.tsx
git commit -m "feat: add Messages tab with unread badge to bottom nav"
```

---

## Task 8: Email-notification Edge Function

**Files:**
- Create: `supabase/functions/send-message-email/index.ts`

**Interfaces:**
- Consumes: the `messages` table shape from Task 1 (via the Database Webhook's payload), Supabase's built-in Edge Function environment (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by the platform, not manually set), and a manually-set `RESEND_API_KEY` secret.
- Produces: an HTTP endpoint (once deployed) that a Supabase Database Webhook calls on every `messages` `INSERT`.

This task has no automated test — this repo has no Deno/Edge Function test convention (it's greenfield infrastructure), and Vitest/jsdom doesn't run Deno code. Verification is a careful read-through of the code plus, where the Supabase CLI is available, a local `supabase functions serve` smoke test. **Deployment itself (installing/linking the Supabase CLI, setting the `RESEND_API_KEY` secret, deploying, and configuring the Database Webhook) is explicitly NOT part of this task** — it requires the user's own Resend account and live changes to the Supabase project, which is a separate, human-in-the-loop step after this code is reviewed. Write only the function file.

- [ ] **Step 1: Write the function**

Create `supabase/functions/send-message-email/index.ts`:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// Where the "view this message" link in the email points. Override via the
// APP_URL secret once a production domain exists; the demo URL is a
// reasonable default for now, not a hardcoded assumption about the future.
const APP_URL = Deno.env.get("APP_URL") ?? "https://filesmart-demo.netlify.app";
// Resend's shared sandbox sender, until a verified sending domain exists —
// override via the RESEND_FROM_ADDRESS secret once one is set up.
const FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") ?? "onboarding@resend.dev";

interface MessageWebhookPayload {
  type: "INSERT";
  table: "messages";
  record: {
    id: string;
    recipient_user_id: string;
    subject: string;
    body: string;
    category: string;
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[send-message-email] Missing required environment secrets");
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: MessageWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const message = payload.record;
  if (!message?.recipient_user_id || !message.subject || !message.body) {
    console.error("[send-message-email] Payload missing required fields:", payload);
    return new Response("Missing required message fields", { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    message.recipient_user_id
  );
  if (userError || !userData?.user?.email) {
    console.error("[send-message-email] Could not resolve recipient email:", userError);
    return new Response("Recipient email not found", { status: 404 });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: userData.user.email,
      subject: message.subject,
      html: `<p>${escapeHtml(message.body)}</p><p><a href="${APP_URL}/messages">View this message in FileSmart</a></p>`,
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error("[send-message-email] Resend API error:", resendResponse.status, errorText);
    // Deliberately not retried, and this failure never touches the
    // messages row itself — the message is already saved and visible
    // in-app regardless of whether this email send succeeds.
    return new Response("Failed to send email", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
```

- [ ] **Step 2: Review the function**

Read the file back and confirm: every field read from `payload.record` is validated before use (no unchecked property access that could throw on a malformed payload — this is Review Focus item 4 from the plan header); the Resend failure path returns a clear error and logs it, without touching the `messages` table; no secret value is ever logged (only the presence/absence of secrets, via the boolean check, and Resend's own error response body — never `RESEND_API_KEY` itself).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/send-message-email/index.ts
git commit -m "feat: add send-message-email Edge Function"
```

---

## Final verification

- [ ] Run `npx vitest run --no-file-parallelism` once more from a clean state and confirm the whole suite is green.
- [ ] Run `npm run build` to confirm the TypeScript/Vite build succeeds with the new page, hooks, and nav item.
- [ ] **Deployment is a separate follow-up, not part of this plan's tasks**: once the user has a Resend account and API key ready, the remaining steps are: install/link the Supabase CLI in this environment, `supabase secrets set RESEND_API_KEY=...` (and optionally `RESEND_FROM_ADDRESS`/`APP_URL`), `supabase functions deploy send-message-email`, then configure a Database Webhook in the Supabase Dashboard (Database → Webhooks) on `messages` `INSERT` pointing at the deployed function's URL. This needs to happen with the user directly, not as an autonomous task.
