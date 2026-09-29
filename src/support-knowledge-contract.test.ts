import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = resolve(process.cwd(), "supabase/migrations/20260929000000_support_chat_contract.sql");
const generator = resolve(process.cwd(), "scripts/generate-support-knowledge.mts");
const glossary = resolve(process.cwd(), "src/data/taxGlossary.json");

const runGenerator = (input = glossary) => execFileSync(process.execPath, [generator, input], {
  cwd: process.cwd(), encoding: "utf8",
});

describe("support knowledge contract", () => {
  it("limits search to verified Nigerian records effective on the requested date", () => {
    const sql = readFileSync(migration, "utf8").toLowerCase().replace(/\s+/g, " ");
    expect(sql).toContain("create table public.support_knowledge");
    expect(sql).toContain("review_status text not null check (review_status in ('verified', 'needs_review'))");
    expect(sql).toContain("create or replace function public.search_support_knowledge(p_query text, p_as_of date, p_limit integer default 5)");
    expect(sql).toContain("k.jurisdiction = 'ng'");
    expect(sql).toContain("k.review_status = 'verified'");
    expect(sql).toContain("k.effective_from <= p_as_of");
    expect(sql).toContain("k.effective_to is null or k.effective_to >= p_as_of");
    expect(sql).toMatch(/to_tsvector\([^;]+@@[^;]+to_tsquery\(/);
    expect(sql).toMatch(/limit\s+least\(greatest\(coalesce\(p_limit, 5\), 0\), 5\)/);
    expect(sql).not.toMatch(/returns table\s*\([^)]*(search_text|review_owner)/);
  });

  it("projects only approved private summary fields", () => {
    const sql = readFileSync(migration, "utf8").toLowerCase().replace(/\s+/g, " ");
    expect(sql).toContain("returns table ( declaration_id uuid, tax_year text, declaration_type text, status text, document_count integer, created_at timestamptz )");
    expect(sql).toContain("returns table (unread_count bigint)");
    expect(sql).toContain("returns table (is_complete boolean, missing_fields text[])");
    for (const forbidden of ["d.form_data", "d.amount", "d.documents as", "m.body", "m.subject", "p.name as", "p.phone as", "p.tax_id as"]) {
      expect(sql).not.toContain(forbidden);
    }
    expect(sql).toContain("jsonb_array_length(d.documents)");
    expect(sql).toContain("m.read_at is null");
  });

  it("generates repeatable upserts with source and review metadata", () => {
    const first = runGenerator();
    expect(runGenerator()).toBe(first);
    expect(first).toContain("insert into public.support_knowledge");
    expect(first).toContain("on conflict (id) do update");
    expect(first).toContain("'tax-content-review'");
    expect(first).toContain("'https://nass.gov.ng/documents/download/11250'");
    expect(first).toContain("'2026-01-01'");
    expect(first).toContain("'2026-09-28'");
    expect(first).toContain("'Tax ID Taxpayer Identification Taxpayer Identification Number TIN A unique identifier");
    expect(first.indexOf("'allowances'")).toBeLessThan(first.indexOf("'tax-id'"));
  });

  it("rejects unverified and missing-source glossary entries", () => {
    const directory = mkdtempSync(join(tmpdir(), "support-knowledge-"));
    try {
      const entry = JSON.parse(readFileSync(glossary, "utf8"))[0];
      for (const invalid of [
        { ...entry, reviewStatus: "needs_review" },
        { ...entry, sourceUrl: "" },
        { ...entry, statutoryReference: "" },
        { ...entry, lastVerified: "" },
      ]) {
        const fixture = join(directory, "glossary.json");
        writeFileSync(fixture, JSON.stringify([invalid]));
        const result = spawnSync(process.execPath, [generator, fixture], {
          cwd: process.cwd(), encoding: "utf8",
        });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain("Unverified or incomplete glossary entry");
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
