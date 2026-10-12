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
    taxGuides.forEach((guide) => {
      expect(screen.getAllByRole("link", { name: new RegExp(guide.title, "i") })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ href: expect.stringContaining(`/learn/${guide.slug}`) }),
        ]),
      );
    });
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("renders known guide content semantically", () => {
    renderRoute("/learn/paye-explained", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /paye in nigeria/i })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText(/general educational information only/i)).toBeInTheDocument();
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("helps visitors recover from an unknown guide slug", () => {
    renderRoute("/learn/not-a-real-guide", <Guide />);

    expect(screen.getByRole("heading", { level: 1, name: /guide not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to all guides/i })).toHaveAttribute("href", "/learn");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });
});
