# Plan: Event-driven sync architecture

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace unbounded duplicate sync loops with one shared, bounded sync coordinator and Supabase Realtime updates applied directly to the encrypted local store.

**Architecture:** Mount a `SyncProvider` in the authenticated app shell. The provider owns one online/offline lifecycle, one in-flight sync promise, bounded exponential retry, and one Realtime channel per authenticated user. Realtime payloads are validated against the current user and translated into Dexie updates; full sync remains an explicit bootstrap/reconnect/manual operation. Add a Supabase publication migration for the subscribed tables.

**Tech Stack:** React 18, TypeScript, Supabase JS v2, Dexie, Vitest, React Testing Library.

## Task 1: Bound retries and centralize sync state

**Files:** `src/lib/sync-retry.ts`, `src/lib/sync-retry.test.ts`, `src/contexts/SyncContext.tsx`, `src/contexts/SyncContext.test.tsx`, `src/hooks/use-sync.ts`, `src/components/layout/AppLayout.tsx`, `src/components/layout/OfflineBanner.tsx`, `src/pages/Dashboard.tsx`

**Tests first:** Add tests proving the retry policy stops after a finite number of scheduled retries and that multiple consumers read the same provider-owned status/run function. Run the focused tests and observe the failure before adding implementation.

**Implementation:** Extract a finite retry policy with a documented maximum of three retries. Create `SyncProvider`/`useSync` context; guard concurrent calls with a shared in-flight promise; clear timers and browser listeners on unmount; reset the retry budget on success, reconnect, and manual retry. Move the provider into `AppLayout`, and make `OfflineBanner` and `Dashboard` consumers rather than independent coordinators. Preserve audit-request notifications and show a manual retry state after exhaustion.

**Verification:** `npm test -- --run src/lib/sync-retry.test.ts src/contexts/SyncContext.test.tsx src/App.test.tsx`

## Task 2: Add validated Realtime-to-Dexie updates

**Files:** `src/lib/realtime-sync.ts`, `src/lib/realtime-sync.test.ts`, `src/lib/api.ts`, `src/contexts/SyncContext.tsx`

**Tests first:** Add tests for owned INSERT/UPDATE payloads, DELETE payloads, pending-local-write protection, rejection of cross-user payloads, channel registration, and channel cleanup. Run the focused test and observe the failure before adding implementation.

**Implementation:** Export server-row mappers from `api.ts` and implement a Realtime subscription helper for profiles, declarations, activities, and messages. Validate the owner field before writing; skip server overwrites while a local row has `pendingSync`; remove deleted local records; clean up with `supabase.removeChannel`. Keep event application incremental so a server change does not trigger a full-table pull.

**Verification:** `npm test -- --run src/lib/realtime-sync.test.ts src/lib/sync-service.test.ts src/contexts/SyncContext.test.tsx`

## Task 3: Enable the Realtime publication and finish integration

**Files:** `supabase/migrations/20260928000000_enable_realtime_sync.sql`, `src/contexts/SyncContext.tsx`, `src/lib/realtime-sync.ts`

**Implementation:** Add an idempotent migration that adds all four user-scoped tables to `supabase_realtime`. Subscribe after obtaining the authenticated user, perform one bootstrap sync, reconnect subscriptions after browser `online`, and keep full sync limited to bootstrap/reconnect/manual actions. Ensure provider teardown removes the channel and clears every timer/listener.

**Verification:** `npm test`, `npm run lint`, `npm run build`

## Review focus

- No `setInterval`, polling loops, or unbounded retry timer remains in the sync path.
- Only one `SyncProvider` exists in the authenticated shell.
- Realtime payloads cannot write another user’s data into IndexedDB.
- Pending local declarations/activities/read-status changes are never clobbered by server events.
- All subscriptions, browser listeners, and timers are torn down.
- The migration is safe to apply more than once.
