import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PublicNav from "./PublicNav";

describe("PublicNav", () => {
  it("makes FileSmart branding and product discovery prominent", () => {
    render(<MemoryRouter><PublicNav /></MemoryRouter>);

    expect(screen.getByRole("img", { name: /filesmart brand lockup/i })).toHaveAttribute("src", "/brand/filesmart-lockup.png");
    expect(screen.getByText("Your connect for smarter, easier tax filing.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /file for free/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /tax estimator/i })).toHaveAttribute("href", "/calculator");
    expect(screen.getByRole("link", { name: /file taxes/i })).toHaveAttribute("href", "/declare");
    expect(screen.getByRole("link", { name: /pricing/i })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute("href", "/contact");
  });
});
