import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const defaultInput = fileURLToPath(new URL("../src/data/taxGlossary.json", import.meta.url));
const input = resolve(process.argv[2] ?? defaultInput);
const entries = JSON.parse(readFileSync(input, "utf8"));

const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const validDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

if (!Array.isArray(entries) || entries.length === 0) {
  throw new Error("Glossary must be a nonempty array");
}

const ids = new Set<string>();
for (const entry of entries) {
  if (typeof entry !== "object" || entry === null ||
      ![entry.id, entry.term, entry.definition, entry.statutoryReference].every(nonempty) ||
      !Array.isArray(entry.aliases) || !entry.aliases.every(nonempty) ||
      !nonempty(entry.sourceUrl) || !/^https:\/\/[^\s/]+\//.test(entry.sourceUrl) ||
      !validDate(entry.effectiveFrom) || !validDate(entry.lastVerified) ||
      entry.reviewStatus !== "verified") {
    throw new Error(`Unverified or incomplete glossary entry: ${entry?.id ?? "unknown"}`);
  }
  if (ids.has(entry.id)) throw new Error(`Duplicate glossary id: ${entry.id}`);
  ids.add(entry.id);
}

entries.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const values = entries.map((entry) => {
  const searchText = [entry.term, ...entry.aliases, entry.definition, entry.statutoryReference].join(" ");
  return `  (${literal(entry.id)}, ${literal(entry.term)}, ${literal(JSON.stringify(entry.aliases))}::jsonb, ${literal(entry.definition)}, ${literal(entry.statutoryReference)}, ${literal(entry.sourceUrl)}, 'NG', ${literal(entry.effectiveFrom)}::date, null, 'tax-content-review', ${literal(entry.lastVerified)}::date, 'verified', ${literal(searchText)})`;
});

process.stdout.write(`-- Generated from approved taxGlossary.json; review before applying.\n` +
  `insert into public.support_knowledge (id, term, aliases, definition, statutory_reference, source_url, jurisdiction, effective_from, effective_to, review_owner, last_verified, review_status, search_text)\n` +
  `values\n${values.join(",\n")}\n` +
  `on conflict (id) do update set\n` +
  `  term = excluded.term, aliases = excluded.aliases, definition = excluded.definition,\n` +
  `  statutory_reference = excluded.statutory_reference, source_url = excluded.source_url,\n` +
  `  jurisdiction = excluded.jurisdiction, effective_from = excluded.effective_from,\n` +
  `  effective_to = excluded.effective_to, review_owner = excluded.review_owner,\n` +
  `  last_verified = excluded.last_verified, review_status = excluded.review_status,\n` +
  `  search_text = excluded.search_text, updated_at = now();\n`);
