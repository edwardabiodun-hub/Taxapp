import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260927000000_security_remediation.sql",
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
});
