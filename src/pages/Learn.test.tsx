import { render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: /nigeria tax law 2026/i })).toHaveClass("min-w-0");
    taxGuides.forEach((guide) => {
      const accessibleTitle = guide.title.replace(/₦/g, "Naira ");
      const escapedTitle = accessibleTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(screen.getAllByRole("link", { name: new RegExp(escapedTitle, "i") })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ href: expect.stringContaining(`/learn/${guide.slug}`) }),
        ]),
      );
    });
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("shows a human image for every education guide card", () => {
    renderRoute("/learn", <Learn />);

    taxGuides.forEach((guide) => {
      const guideImages = screen
        .getAllByRole("img")
        .filter((image) => image.getAttribute("src") === guide.image?.src);
      expect(guideImages.length).toBeGreaterThan(0);
      expect(guideImages[0]).toHaveAttribute("alt", guide.image?.alt);
    });
  });

  it("keeps public education navigation and guide actions at least 44px tall", () => {
    renderRoute("/learn", <Learn />);

    expect(screen.getByRole("link", { name: /filesmart home/i }).className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /file for free/i }).className).toContain("min-h-11");
    expect(screen.getAllByRole("link", { name: /nigeria tax law 2026/i })[0].className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /read nigeria tax law 2026/i }).className).toContain("min-h-11");
  });

  it("keeps guide navigation and primary actions at least 44px tall", () => {
    renderRoute("/learn/nigeria-tax-law-2026-personal-income-tax", <Guide />);

    expect(
      within(screen.getByRole("navigation", { name: /main navigation/i })).getByRole("link", {
        name: /tax education/i,
      }).className,
    ).toContain("min-h-11");
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
      "https://www.filesmartnaija.com/learn",
    );
  });

  it("renders known guide content semantically", () => {
    renderRoute("/learn/nigeria-tax-law-2026-personal-income-tax", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /nigeria tax law 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("break-words");
    expect(screen.getByRole("main").className).toContain("overflow-x-hidden");
    expect(screen.getByRole("article").className).toContain("break-words");
    expect(screen.getAllByRole("list")[0]).toBeInTheDocument();
    expect(screen.getByText(/general educational information only/i)).toBeInTheDocument();
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("shows the review status and internal CTA on a new guide", () => {
    renderRoute("/learn/nigeria-paye-tax-calculator-2026", <Guide />);

    expect(screen.getByText(/professional review pending/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /calculate your paye estimate/i })).toHaveAttribute(
      "href",
      "/calculator",
    );
    expect(screen.getByRole("img", { name: /woman reviewing tax records/i })).toHaveAttribute(
      "src",
      "/images/filesmart-hero-tax-preparation.webp",
    );
  });

  it("renders the 2026 tax article cluster with structured sections and references", () => {
    renderRoute("/learn/nigeria-tax-law-2026-personal-income-tax", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /nigeria tax law 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /new personal income tax rates/i })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nigeria tax act 2025/i })).toHaveAttribute("target", "_blank");
  });

  it("sets article metadata for a known guide", () => {
    renderRoute("/learn/nigeria-tax-law-2026-personal-income-tax", <Guide />);

    expect(document.title).toBe("Nigeria Tax Law 2026: New PAYE Rates and Changes Explained | FileSmart");
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://www.filesmartnaija.com/learn/nigeria-tax-law-2026-personal-income-tax",
    );
    expect(document.head.querySelector('meta[property="og:type"]')).toHaveAttribute("content", "article");
    expect(document.head.querySelector('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      "2026-10-14",
    );
    expect(document.head.querySelector('meta[property="article:modified_time"]')).toHaveAttribute(
      "content",
      "2026-10-14",
    );
  });

  it("helps visitors recover from an unknown guide slug", () => {
    renderRoute("/learn/not-a-real-guide", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /guide not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to all guides/i })).toHaveAttribute("href", "/learn");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });
});
