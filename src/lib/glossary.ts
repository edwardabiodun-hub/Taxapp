import rawGlossary from "@/data/taxGlossary.json";

export type GlossaryEntry = {
  id: string;
  term: string;
  aliases: string[];
  definition: string;
  statutoryReference: string;
  sourceUrl: string;
  sourceType?: "legislation" | "FIRS-guidance" | "case-law";
  effectiveFrom?: string | null;
  lastVerified?: string;
  reviewStatus?: "verified" | "needs-review";
};

const SOURCE_TYPES = new Set<NonNullable<GlossaryEntry["sourceType"]>>([
  "legislation",
  "FIRS-guidance",
  "case-law",
]);
const REVIEW_STATUSES = new Set<NonNullable<GlossaryEntry["reviewStatus"]>>(["verified", "needs-review"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string, index: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid glossary entry ${index}: ${field} must be a non-empty string.`);
  }
  return value;
}

export function parseGlossaryEntries(value: unknown): GlossaryEntry[] {
  if (!Array.isArray(value) || value.length < 15) {
    throw new Error("Invalid glossary dataset: at least 15 entries are required.");
  }

  return value.map((candidate, index) => {
    if (!isRecord(candidate)) throw new Error(`Invalid glossary entry ${index}: expected an object.`);

    const sourceUrl = requiredString(candidate.sourceUrl, "sourceUrl", index);
    try {
      new URL(sourceUrl);
    } catch {
      throw new Error(`Invalid glossary entry ${index}: sourceUrl must be a valid URL.`);
    }

    const aliases = candidate.aliases;
    if (!Array.isArray(aliases) || aliases.some((alias) => typeof alias !== "string")) {
      throw new Error(`Invalid glossary entry ${index}: aliases must be an array of strings.`);
    }

    const sourceType = candidate.sourceType;
    if (sourceType !== undefined && (typeof sourceType !== "string" || !SOURCE_TYPES.has(sourceType as GlossaryEntry["sourceType"]))) {
      throw new Error(`Invalid glossary entry ${index}: unsupported sourceType.`);
    }

    const effectiveFromValue = candidate.effectiveFrom;
    if (effectiveFromValue !== undefined && effectiveFromValue !== null && typeof effectiveFromValue !== "string") {
      throw new Error(`Invalid glossary entry ${index}: effectiveFrom must be a string or null.`);
    }
    const effectiveFrom = effectiveFromValue as string | null | undefined;

    const lastVerifiedValue = candidate.lastVerified;
    if (lastVerifiedValue !== undefined && typeof lastVerifiedValue !== "string") {
      throw new Error(`Invalid glossary entry ${index}: lastVerified must be a string.`);
    }
    const lastVerified = lastVerifiedValue as string | undefined;

    const reviewStatus = candidate.reviewStatus;
    if (reviewStatus !== undefined && (typeof reviewStatus !== "string" || !REVIEW_STATUSES.has(reviewStatus as GlossaryEntry["reviewStatus"]))) {
      throw new Error(`Invalid glossary entry ${index}: unsupported reviewStatus.`);
    }

    return {
      id: requiredString(candidate.id, "id", index),
      term: requiredString(candidate.term, "term", index),
      aliases,
      definition: requiredString(candidate.definition, "definition", index),
      statutoryReference: requiredString(candidate.statutoryReference, "statutoryReference", index),
      sourceUrl,
      ...(sourceType === undefined ? {} : { sourceType: sourceType as GlossaryEntry["sourceType"] }),
      ...(effectiveFrom === undefined ? {} : { effectiveFrom }),
      ...(lastVerified === undefined ? {} : { lastVerified }),
      ...(reviewStatus === undefined ? {} : { reviewStatus: reviewStatus as GlossaryEntry["reviewStatus"] }),
    };
  });
}

export const glossaryEntries = parseGlossaryEntries(rawGlossary);

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
