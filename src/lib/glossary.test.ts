import { describe, expect, it } from "vitest";

import { glossaryEntries, tokenizeGlossaryText } from "./glossary";

describe("tax glossary", () => {
  it("contains a source-backed current-law dataset", () => {
    expect(glossaryEntries.length).toBeGreaterThanOrEqual(15);
    expect(glossaryEntries.every((entry) => entry.sourceUrl.startsWith("https://"))).toBe(true);
    expect(glossaryEntries.every((entry) => entry.statutoryReference.length > 0)).toBe(true);
    expect(glossaryEntries.every((entry) => entry.definition.split(/\s+/).length <= 40)).toBe(true);
  });

  it("matches aliases case-insensitively while preserving surrounding text", () => {
    const matches = tokenizeGlossaryText("Please review your tax ID, then VAT.");

    expect(matches).toEqual([
      { text: "Please review your " },
      { text: "tax ID", entryId: "tax-id" },
      { text: ", then " },
      { text: "VAT", entryId: "value-added-tax" },
      { text: "." },
    ]);
  });

  it("prefers the longest matching phrase and does not match inside words", () => {
    const entries = [
      { id: "tax", term: "Tax", aliases: [], definition: "A tax.", statutoryReference: "Test", sourceUrl: "https://example.com" },
      { id: "tax-return", term: "Tax Return", aliases: [], definition: "A tax return.", statutoryReference: "Test", sourceUrl: "https://example.com" },
    ];

    expect(tokenizeGlossaryText("Taxation is not a match.", entries)).toEqual([
      { text: "Taxation is not a match." },
    ]);
    expect(tokenizeGlossaryText("File a Tax Return today.", entries)).toEqual([
      { text: "File a " },
      { text: "Tax Return", entryId: "tax-return" },
      { text: " today." },
    ]);
  });

  it("recognizes calculator terminology and prefers the longest phrase", () => {
    const tokens = tokenizeGlossaryText(
      "Annual Salary, Business Income (Net), Benefits in Kind, and Consolidated Relief Allowance.",
    );

    expect(tokens.filter((token) => token.entryId).map((token) => token.entryId)).toEqual([
      "annual-salary",
      "business-income",
      "benefits-in-kind",
      "consolidated-relief-allowance",
    ]);
  });

  it("does not match a terminology fragment inside an unrelated word", () => {
    const tokens = tokenizeGlossaryText("salaryman does not mean Annual Salary");

    expect(tokens.filter((token) => token.entryId).map((token) => token.entryId)).toEqual(["annual-salary"]);
  });
});
