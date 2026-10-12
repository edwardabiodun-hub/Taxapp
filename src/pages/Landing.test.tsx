import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";

describe("Landing", () => {
  it("routes users into the existing browser onboarding flow", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(screen.getAllByRole("link", { name: /start (filing )?online/i })[0]).toHaveAttribute("href", "/onboarding");
  });

  it("uses the canonical FileSmart lockup asset", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const brandImage = within(screen.getByRole("banner")).getByRole("img", { name: /filesmart brand lockup/i });

    expect(brandImage).toHaveAttribute("alt", "FileSmart brand lockup");
    expect(brandImage).toHaveAttribute("src", "/brand/filesmart-lockup.png");
  });

  it("expands and collapses FAQ answers accessibly", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const question = screen.getByRole("button", { name: /can i start my tax preparation/i });

    expect(question).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
  });
});
