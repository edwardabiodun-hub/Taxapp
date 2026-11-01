import { describe, expect, it } from "vitest";
import { getNewsArticle, newsArticles } from "./news";

describe("news content", () => {
  it("publishes the Nigeria Tax Calculator launch article with a unique image", () => {
    expect(newsArticles).toHaveLength(1);
    expect(new Set(newsArticles.map((article) => article.slug)).size).toBe(newsArticles.length);
    expect(new Set(newsArticles.map((article) => article.image.src)).size).toBe(newsArticles.length);

    const article = getNewsArticle("filesmart-nigeria-tax-calculator-launch");
    expect(article?.title).toContain("Nigeria Tax Calculator");
    expect(article?.blocks.some((block) => block.type === "faq")).toBe(true);
    expect(article?.cta).toEqual({ label: "Try the Nigeria Tax Calculator", href: "/calculator" });
  });
});
