import {
  getTaxGuide,
  getTaxGuidesByCategory,
  taxGuides,
} from "./tax-guides";

describe("tax guide content", () => {
  it("contains five complete guides with unique slugs and valid metadata", () => {
    const slugs = taxGuides.map((guide) => guide.slug);

    expect(taxGuides).toHaveLength(5);
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
        "nigerian-pit-basics",
        "paye-explained",
        "filing-deadlines",
        "eligible-deductions",
        "tax-preparation-checklist",
      ]),
    );
  });

  it("looks up guides and returns all guides when no category is supplied", () => {
    expect(getTaxGuide("paye-explained")?.title).toContain("PAYE");
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
});
