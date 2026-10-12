import { beforeEach, describe, expect, it } from "vitest";
import { setPageMetadata } from "./seo";

describe("setPageMetadata", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "Original title";
  });

  it("sets page, canonical, and Open Graph metadata", () => {
    setPageMetadata({
      title: "FileSmart | Simple Nigerian tax preparation",
      description: "Prepare your Nigerian personal income tax information.",
      path: "/",
    });

    expect(document.title).toBe("FileSmart | Simple Nigerian tax preparation");
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Prepare your Nigerian personal income tax information.",
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "http://localhost:3000/",
    );
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "FileSmart | Simple Nigerian tax preparation",
    );
    expect(document.head.querySelector('meta[property="og:description"]')).toHaveAttribute(
      "content",
      "Prepare your Nigerian personal income tax information.",
    );
    expect(document.head.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "website");
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "http://localhost:3000/",
    );
  });

  it("adds article dates and restores the prior document state on cleanup", () => {
    document.title = "Prior title";
    const description = document.createElement("meta");
    description.name = "description";
    description.content = "Prior description";
    document.head.append(description);

    const cleanup = setPageMetadata({
      title: "Article title",
      description: "Article description",
      path: "/article",
      type: "article",
      publishedTime: "2026-10-12T00:00:00.000Z",
      modifiedTime: "2026-10-13T00:00:00.000Z",
    });

    expect(document.head.querySelector('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      "2026-10-12T00:00:00.000Z",
    );
    expect(document.head.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "article");
    expect(document.head.querySelector('meta[property="article:modified_time"]')).toHaveAttribute(
      "content",
      "2026-10-13T00:00:00.000Z",
    );

    cleanup();

    expect(document.title).toBe("Prior title");
    expect(document.head.querySelector('meta[name="description"]')).toBe(description);
    expect(description).toHaveAttribute("content", "Prior description");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:title"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:description"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:type"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.head.querySelector('meta[property="article:published_time"]')).toBeNull();
    expect(document.head.querySelector('meta[property="article:modified_time"]')).toBeNull();
  });
});
