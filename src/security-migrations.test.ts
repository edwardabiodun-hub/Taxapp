import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260927000000_security_remediation.sql",
);
const rateLimitMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260927010000_rate_limits.sql",
);
const realtimeMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260928000000_enable_realtime_sync.sql",
);
const supportMigrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260929000000_support_chat_contract.sql",
);

describe("security remediation migration", () => {
  it("enforces activity declaration ownership on insert and update", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const sql = readFileSync(migrationPath, "utf8");
    const normalized = sql.replace(/\s+/g, " ");

    expect(sql).toContain("create or replace function public.check_activity_declaration_ownership()");
    expect(normalized).toContain("where d.id = new.declaration_id and d.user_id = new.user_id");
    expect(normalized).toContain("before insert or update on public.activities");
  });

  it("guards authoritative declaration and profile writes", () => {
    const sql = readFileSync(migrationPath, "utf8");
    const normalized = sql.replace(/\s+/g, " ");

    expect(normalized).toContain("create or replace function public.guard_user_declaration_write()");
    expect(normalized).toContain("before insert or update on public.declarations");
    expect(normalized).toContain("create or replace function public.guard_user_profile_write()");
    expect(normalized).toContain("before insert or update on public.profiles");
    expect(normalized).toContain("new.pseudonymized_at := null");
    expect(normalized).toContain("create or replace function public.pseudonymize_own_profile()");
    expect(normalized).toContain("grant execute on function public.pseudonymize_own_profile() to authenticated");
  });

  it("provides atomic private rate-limit storage", () => {
    expect(existsSync(rateLimitMigrationPath)).toBe(true);
    const sql = readFileSync(rateLimitMigrationPath, "utf8").replace(/\s+/g, " ");

    expect(sql).toContain("create table if not exists private.rate_limits");
    expect(sql).toContain("create or replace function public.consume_rate_limit");
    expect(sql).toContain("on conflict (key) do update");
    expect(sql).toContain("grant execute on function public.consume_rate_limit");
  });

  it("provides duplicate-safe message delivery functions", () => {
    const sql = readFileSync(migrationPath, "utf8").replace(/\s+/g, " ");

    expect(sql).toContain("create table public.message_email_deliveries");
    expect(sql).toContain("create or replace function public.claim_message_email_delivery");
    expect(sql).toContain("create or replace function public.mark_message_email_sent");
    expect(sql).toContain("create or replace function public.mark_message_email_failed");
    expect(sql).toContain("for update");
  });

  it("publishes every user-scoped sync table and preserves ownership on deletes", () => {
    expect(existsSync(realtimeMigrationPath)).toBe(true);
    const sql = readFileSync(realtimeMigrationPath, "utf8").replace(/\s+/g, " ");

    expect(sql).toContain("alter publication supabase_realtime add table public.%I");
    expect(sql).toContain("array['profiles', 'declarations', 'activities', 'messages']");
    expect(sql).toContain("alter table public.profiles replica identity full");
    expect(sql).toContain("alter table public.messages replica identity full");
  });

  it("keeps public knowledge service-only and private summaries JWT/RLS scoped", () => {
    expect(existsSync(supportMigrationPath)).toBe(true);
    const sql = readFileSync(supportMigrationPath, "utf8").toLowerCase().replace(/\s+/g, " ");
    expect(sql).toContain("alter table public.support_knowledge enable row level security");
    expect(sql).toContain("revoke all on table public.support_knowledge from public, anon, authenticated");
    expect(sql).toContain("grant select on table public.support_knowledge to service_role");
    expect(sql).toContain("revoke all on function public.search_support_knowledge(text, date, integer) from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.search_support_knowledge(text, date, integer) to service_role");
    for (const name of ["get_my_declaration_status", "get_my_support_message_summary", "get_my_profile_completion"]) {
      expect(sql).toContain(`create or replace function public.${name}()`);
      expect(sql).toContain(`revoke all on function public.${name}() from public, anon, authenticated`);
      expect(sql).toContain(`grant execute on function public.${name}() to authenticated`);
    }
    expect(sql).toContain("d.user_id = auth.uid()");
    expect(sql).toContain("m.recipient_user_id = auth.uid()");
    expect(sql).toContain("p.id = auth.uid()");
    expect(sql).toContain("security invoker");
    expect(sql).not.toContain("security definer");
  });
});
