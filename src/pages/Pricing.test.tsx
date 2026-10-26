import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Pricing from "./Pricing";

describe("Pricing", () => {
  it("shows the free-filing message without publishing unapproved eligibility thresholds", () => {
    render(<MemoryRouter><Pricing /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /file for free if you qualify/i })).toBeInTheDocument();
    expect(screen.getByText(/eligibility and final prices will be confirmed before paid plans launch/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/below\s*2,000,000/i);
    expect(screen.getByText(/file for free with filesmart/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /file for free/i })[0]).toHaveAttribute("href", "/onboarding");
  });
});
