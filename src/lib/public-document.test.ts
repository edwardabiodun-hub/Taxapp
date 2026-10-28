import { describe, expect, it } from "vitest";
import { renderPublicDocument } from "./public-document";

describe("renderPublicDocument", () => {
  const template = `<!doctype html><html><head><title>Default</title><meta name="description" content="Default description"><link rel="canonical" href="https://example.test/"></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>`;

  it("embeds rendered route content and route-specific metadata in initial HTML", () => {
    const html = renderPublicDocument(template, "<main><h1>Tax estimator</h1></main>", {
      title: "Personal income tax estimator | FileSmart",
      description: "Estimate a 2026 tax position.",
      path: "/calculator",
    }, "https://example.test");

    expect(html).toContain("<h1>Tax estimator</h1>");
    expect(html).toContain("<title>Personal income tax estimator | FileSmart</title>");
    expect(html).toContain('content="Estimate a 2026 tax position."');
    expect(html).toContain('href="https://example.test/calculator"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"WebPage"');
  });

  it("marks the generated not-found document noindex and omits a misleading canonical", () => {
    const html = renderPublicDocument(template, "<main><h1>Page not found</h1></main>", {
      title: "Page not found | FileSmart",
      description: "The page could not be found.",
      path: "/404",
    }, "https://example.test", { noIndex: true });

    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).not.toContain('rel="canonical"');
    expect(html).toContain("Page not found");
  });

  it("escapes metadata and JSON-LD strings before inserting them into HTML", () => {
    const html = renderPublicDocument(template, "<main>Safe</main>", {
      title: `A <script>alert("x")</script> title`,
      description: "A & B",
      path: "/learn/example",
    }, "https://example.test");

    expect(html).toContain("A &lt;script&gt;");
    expect(html).not.toContain("<title>A <script>");
    expect(html).not.toContain('"A & B"');
  });
});
