import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

describe("PublicNav accessibility contract", () => {
  it("exposes a keyboard-friendly mobile menu with synchronized state", async () => {
    vi.stubEnv("VITE_FILING_LAUNCH_PHASE", "true");
    vi.resetModules();
    const { default: PublicNav } = await import("./PublicNav");

    render(<MemoryRouter><PublicNav /></MemoryRouter>);

    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-navigation");

    fireEvent.click(menuButton);

    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(menuButton).toHaveAccessibleName("Close navigation menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(within(mobileNavigation).getByRole("link", { name: "Tax estimator" })).toHaveAttribute("href", "/calculator");
    expect(within(mobileNavigation).getByRole("link", { name: "Join waitlist" })).toHaveAttribute("href", "/filing-waitlist");

    fireEvent.click(menuButton);

    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});
