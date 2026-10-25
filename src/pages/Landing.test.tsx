import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Landing from "./Landing";

describe("Landing", () => {
  it("makes free filing the primary launch CTA while preserving onboarding", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(screen.getAllByRole("link", { name: /file for free/i })[0]).toHaveAttribute("href", "/onboarding");
    expect(screen.getAllByRole("img", { name: "Naira" }).length).toBeGreaterThanOrEqual(3);
  });

  it("keeps visible copy natural while retaining the Nigerian tax search context in metadata", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(screen.getByText(/clear, guided support as you prepare your personal income tax/i)).toBeInTheDocument();
    expect(screen.queryByText(/your Nigerian personal income tax preparation/i)).not.toBeInTheDocument();
    expect(document.title).toBe("FileSmart | Simple Nigerian tax preparation");
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
    expect(menuButton.className).toContain("h-11");
    expect(menuButton.className).toContain("w-11");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /mobile navigation/i })).toHaveAttribute("id", "mobile-navigation");
  });

  it("keeps the primary public actions at least 44px tall", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    expect(screen.getAllByRole("link", { name: /file for free/i })[0].className).toContain("min-h-11");
    expect(screen.getByRole("link", { name: /see how it works/i }).className).toContain("min-h-11");
  });

  it("keeps desktop landing navigation controls at least 44px tall", () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);

    const navigation = screen.getByRole("navigation", { name: /main navigation/i });
    expect(screen.getByRole("link", { name: /questions/i }).className).toContain("min-h-11");
    expect(navigation.querySelector("a[href='/how-it-works']")?.className).toContain("min-h-11");
    expect(navigation.querySelector("a[href='/learn']")?.className).toContain("min-h-11");
    expect(navigation.querySelector("a[href='/about']")?.className).toContain("min-h-11");
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
    expect(screen.getByRole("link", { name: /nigeria tax law 2026/i })).toHaveAttribute("href", "/learn/nigeria-tax-law-2026-personal-income-tax");
    expect(screen.getByRole("link", { name: /who is exempt from income tax/i })).toHaveAttribute("href", "/learn/personal-income-tax-exemptions-nigeria-2026");
    expect(screen.getByRole("link", { name: /do freelancers pay tax/i })).toHaveAttribute("href", "/learn/freelancer-side-hustle-tax-nigeria-2026");
  });
});
