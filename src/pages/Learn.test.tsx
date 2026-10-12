import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { taxGuides } from "@/content/tax-guides";
import Learn from "./Learn";
import Guide from "./Guide";

function renderRoute(path: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/learn" element={element} />
        <Route path="/learn/:slug" element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("public education routes", () => {
  it("renders every guide as a descriptive link and exposes category filters", () => {
    renderRoute("/learn", <Learn />);

    expect(screen.getByRole("heading", { level: 1, name: /learn about your tax/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all guides/i })).toBeInTheDocument();
    expect(screen.getByRole("main").className).toContain("overflow-x-hidden");
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("break-words");
    expect(screen.getByRole("heading", { name: /nigerian personal income tax basics/i })).toHaveClass("min-w-0");
    taxGuides.forEach((guide) => {
      expect(screen.getAllByRole("link", { name: new RegExp(guide.title, "i") })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ href: expect.stringContaining(`/learn/${guide.slug}`) }),
        ]),
      );
    });
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("keeps public education navigation and guide actions at least 44px tall", () => {
    renderRoute("/learn", <Learn />);

    expect(screen.getByRole("link", { name: /filesmart home/i }).className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /start online/i }).className).toContain("min-h-11");
    expect(screen.getAllByRole("link", { name: /nigerian personal income tax basics/i })[0].className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /read nigerian personal income tax basics/i }).className).toContain("min-h-11");
  });

  it("keeps guide navigation and primary actions at least 44px tall", () => {
    renderRoute("/learn/paye-explained", <Guide />);

    expect(screen.getByRole("link", { name: /all guides/i }).className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /filesmart home/i }).className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /read another guide/i }).className).toContain("min-h-11");
  });

  it("sets index metadata for the education route", () => {
    renderRoute("/learn", <Learn />);

    expect(document.title).toBe("Learn about Nigerian tax | FileSmart");
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Plain-language Nigerian tax education guides for understanding preparation and filing.",
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://filesmart-demo.netlify.app/learn",
    );
  });

  it("renders known guide content semantically", () => {
    renderRoute("/learn/paye-explained", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /paye in nigeria/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("break-words");
    expect(screen.getByRole("main").className).toContain("overflow-x-hidden");
    expect(screen.getByRole("article").className).toContain("break-words");
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText(/general educational information only/i)).toBeInTheDocument();
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("sets article metadata for a known guide", () => {
    renderRoute("/learn/paye-explained", <Guide />);

    expect(document.title).toBe("PAYE in Nigeria: what employees should know | FileSmart");
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://filesmart-demo.netlify.app/learn/paye-explained",
    );
    expect(document.head.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "article");
    expect(document.head.querySelector('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      "2026-10-12",
    );
    expect(document.head.querySelector('meta[property="article:modified_time"]')).toHaveAttribute(
      "content",
      "2026-10-12",
    );
  });

  it("helps visitors recover from an unknown guide slug", () => {
    renderRoute("/learn/not-a-real-guide", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /guide not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to all guides/i })).toHaveAttribute("href", "/learn");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });
});
