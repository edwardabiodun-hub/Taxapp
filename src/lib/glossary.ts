import { z } from "zod";

import rawGlossary from "@/data/taxGlossary.json";

const glossaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  aliases: z.array(z.string()),
  definition: z.string().min(1),
  statutoryReference: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceType: z.enum(["legislation", "FIRS-guidance", "case-law"]).optional(),
  effectiveFrom: z.string().nullable().optional(),
  lastVerified: z.string().optional(),
  reviewStatus: z.enum(["verified", "needs-review"]).optional(),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;

const glossarySchema = z.array(glossaryEntrySchema).min(15);

export const glossaryEntries = glossarySchema.parse(rawGlossary);

type GlossaryToken = { text: string; entryId?: string };

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTerms = (entries: GlossaryEntry[]) => {
  const terms = new Map<string, string>();
  for (const entry of entries) {
    for (const term of [entry.term, ...entry.aliases]) {
      const normalized = term.trim();
      if (normalized) terms.set(normalized.toLocaleLowerCase(), entry.id);
    }
  }
  return [...terms.entries()]
    .sort(([left], [right]) => right.length - left.length)
    .map(([term, entryId]) => ({ term, entryId }));
};

export function tokenizeGlossaryText(text: string, entries: GlossaryEntry[] = glossaryEntries): GlossaryToken[] {
  if (!text) return [];

  const terms = getTerms(entries);
  if (terms.length === 0) return [{ text }];

  const pattern = terms.map(({ term }) => escapeRegExp(term)).join("|");
  const matcher = new RegExp(`(?:^|[^A-Za-z0-9_])(${pattern})(?=$|[^A-Za-z0-9_])`, "giu");
  const tokens: GlossaryToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text))) {
    const matchedTerm = match[1];
    const termStart = match.index + match[0].length - matchedTerm.length;

    if (termStart > lastIndex) tokens.push({ text: text.slice(lastIndex, termStart) });

    const entryId = terms.find(({ term }) => term.toLocaleLowerCase() === matchedTerm.toLocaleLowerCase())?.entryId;
    if (!entryId) {
      tokens.push({ text: matchedTerm });
    } else {
      tokens.push({ text: matchedTerm, entryId });
    }
    lastIndex = termStart + matchedTerm.length;
  }

  if (lastIndex < text.length) tokens.push({ text: text.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ text }];
}

export function getGlossaryEntry(entryId: string): GlossaryEntry | undefined {
  return glossaryEntries.find((entry) => entry.id === entryId);
}
