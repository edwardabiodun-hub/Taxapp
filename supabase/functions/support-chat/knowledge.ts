export interface KnowledgeRow {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  statutory_reference: string;
  source_url: string;
  jurisdiction: string;
  effective_from: string;
  effective_to: string | null;
  review_owner: string;
  last_verified: string;
  review_status: 'verified' | 'needs_review';
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function containsWorkflowContent(row: KnowledgeRow): boolean {
  const content = [row.term, ...row.aliases, row.definition, row.statutory_reference, row.source_url].join(' ');
  return /\bfilesmart\b|\b(?:internal|proprietary|private)\s+(?:workflows?|process(?:es)?|routing|tools?|schemas?|procedures?|queues?|scoring|product)\b/i.test(content);
}

export function selectKnowledgeEntries(rows: KnowledgeRow[], asOf: string): KnowledgeRow[] {
  if (!isIsoDate(asOf)) return [];

  return rows
    .filter((row) => row.jurisdiction === 'NG'
      && row.review_status === 'verified'
      && isIsoDate(row.effective_from)
      && row.effective_from <= asOf
      && (row.effective_to === null || (isIsoDate(row.effective_to) && row.effective_to >= asOf))
      && !containsWorkflowContent(row))
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      term: row.term,
      aliases: [...row.aliases],
      definition: row.definition,
      statutory_reference: row.statutory_reference,
      source_url: row.source_url,
      jurisdiction: row.jurisdiction,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      review_owner: row.review_owner,
      last_verified: row.last_verified,
      review_status: row.review_status,
    }));
}
