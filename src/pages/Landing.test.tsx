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
    const answerId = question.getAttribute("aria-controls");

    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(answerId).toBeTruthy();
    expect(document.getElementById(answerId!)).not.toHaveAttribute("hidden");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(answerId!)).toHaveAttribute("hidden");
    fireEvent.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
  });

  it("exposes mobile navigation state and keeps the control keyboard-focusable", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const menuButton = screen.getByRole("button", { name: /open navigation menu/i });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");
    expect(menuButton.className).toContain("focus-visible:ring");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toHaveAttribute("id", "mobile-navigation");
  });

  it("keeps a single page heading and a focusable public control", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(document.querySelectorAll("h1")).toHaveLength(1);
    const faqButton = screen.getByRole("button", { name: /can i start my tax preparation/i });
    faqButton.focus();
    expect(document.activeElement).toBe(faqButton);
  });

  it("links visitors to the first three education guides and the full library", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(screen.getByRole("link", { name: /view all guides/i })).toHaveAttribute("href", "/learn");
    expect(screen.getByRole("link", { name: /nigerian personal income tax basics/i })).toHaveAttribute("href", "/learn/nigerian-pit-basics");
    expect(screen.getByRole("link", { name: /paye in nigeria/i })).toHaveAttribute("href", "/learn/paye-explained");
    expect(screen.getByRole("link", { name: /finding your nigerian tax filing deadline/i })).toHaveAttribute("href", "/learn/filing-deadlines");
  });
});
