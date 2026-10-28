import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const renderLaunchNav = async () => {
  vi.stubEnv("VITE_FILING_LAUNCH_PHASE", "true");
  vi.resetModules();
  const { default: PublicNav } = await import("./PublicNav");
  render(<MemoryRouter><PublicNav /></MemoryRouter>);
};

describe("PublicNav", () => {
  it("makes FileSmart branding and product discovery prominent", async () => {
    vi.stubEnv("VITE_FILING_LAUNCH_PHASE", "false");
    vi.resetModules();
    const { default: PublicNav } = await import("./PublicNav");
    render(<MemoryRouter><PublicNav /></MemoryRouter>);

    expect(screen.getByRole("img", { name: /filesmart brand lockup/i })).toHaveAttribute("src", "/brand/filesmart-lockup.png");
    expect(screen.getByText("Your connect for smarter, easier tax filing.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /file for free/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /tax estimator/i })).toHaveAttribute("href", "/calculator");
    expect(screen.getByRole("link", { name: /file taxes/i })).toHaveAttribute("href", "/declare");
    expect(screen.getByRole("link", { name: /pricing/i })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "/contact");
  });

  it("routes desktop Pricing to the account-gated pricing page during launch", async () => {
    await renderLaunchNav();

    const mainNavigation = screen.getByRole("navigation", { name: "Main navigation" });
    const pricingLink = within(mainNavigation).getByRole("link", { name: "Pricing" });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
    expect(within(mainNavigation).getByRole("link", { name: "File taxes" })).toHaveAttribute("href", "/filing-waitlist");
  });

  it("routes mobile Pricing to the account-gated pricing page during launch", async () => {
    await renderLaunchNav();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(mobileNavigation).getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
    expect(within(mobileNavigation).getByRole("link", { name: "File taxes" })).toHaveAttribute("href", "/filing-waitlist");
  });
});
