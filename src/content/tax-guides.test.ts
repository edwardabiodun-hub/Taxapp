import {
  getTaxGuide,
  getTaxGuidesByCategory,
  taxGuides,
} from "./tax-guides";

describe("tax guide content", () => {
  it("contains the published guides with unique slugs and valid metadata", () => {
    const slugs = taxGuides.map((guide) => guide.slug);

    expect(taxGuides).toHaveLength(4);
    expect(new Set(slugs).size).toBe(taxGuides.length);

    taxGuides.forEach((guide) => {
      expect(guide.title.trim()).not.toBe("");
      expect(guide.summary.trim()).not.toBe("");
      expect(guide.category.trim()).not.toBe("");
      expect(guide.sourceNote.trim()).not.toBe("");
      [guide.publishedAt, guide.updatedAt].forEach((date) => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(`${date}T00:00:00.000Z`).toISOString()).toBe(
          `${date}T00:00:00.000Z`,
        );
      });
      expect(guide.readTimeMinutes).toBeGreaterThan(0);
      expect(guide.blocks.length).toBeGreaterThan(0);
    });
  });

  it("covers the required Nigerian tax education topics", () => {
    expect(taxGuides.map((guide) => guide.slug)).toEqual(
      expect.arrayContaining([
        "nigeria-tax-law-2026-personal-income-tax",
        "personal-income-tax-exemptions-nigeria-2026",
        "freelancer-side-hustle-tax-nigeria-2026",
        "paye-300000-monthly-nigeria-2026",
      ]),
    );
  });

  it("looks up guides and returns all guides when no category is supplied", () => {
    expect(getTaxGuide("nigeria-tax-law-2026-personal-income-tax")?.title).toContain("PAYE");
    expect(getTaxGuide("not-a-real-guide")).toBeUndefined();
    expect(getTaxGuidesByCategory()).toEqual(taxGuides);
  });

  it("filters guides by category", () => {
    const category = taxGuides[0].category;

    expect(getTaxGuidesByCategory(category)).toEqual(
      taxGuides.filter((guide) => guide.category === category),
    );
    expect(getTaxGuidesByCategory("not-a-real-category")).toEqual([]);
  });

  it("includes the corrected ₦300,000 monthly PAYE example", () => {
    const guide = getTaxGuide("paye-300000-monthly-nigeria-2026");

    expect(guide?.title).toBe("If You Earn ₦300,000 Monthly in Nigeria, How Much Tax Will You Pay in 2026?");
    expect(guide?.blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "table" }),
      expect.objectContaining({ type: "callout", text: expect.not.stringContaining("39,000") }),
    ]));
    expect(guide?.blocks.some((block) => block.type === "paragraph" && block.text.includes("₦36,500"))).toBe(true);
  });
});
