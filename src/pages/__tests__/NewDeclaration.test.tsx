import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NewDeclaration from "@/pages/NewDeclaration";

vi.mock("@/lib/preparation-repository", () => ({
  savePreparation: vi.fn().mockResolvedValue(undefined),
}));

describe("NewDeclaration", () => {
  it("starts with a national jurisdiction selector and local-first preparation language", () => {
    render(
      <MemoryRouter>
        <NewDeclaration />
      </MemoryRouter>,
    );

    expect(screen.getByRole("searchbox", { name: /jurisdiction/i })).toBeInTheDocument();
    expect(screen.getAllByText(/not yet supported/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /save as draft/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit declaration/i })).not.toBeInTheDocument();
  });
});
