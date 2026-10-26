import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Pricing from "./Pricing";

describe("Pricing", () => {
  it("shows the planned Nigerian income-based pricing bands", () => {
    render(<MemoryRouter><Pricing /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: /file for free if you qualify/i })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/below\s*2,000,000/i);
    expect(screen.getAllByRole("img", { name: "Naira" }).length).toBeGreaterThanOrEqual(8);
    expect(screen.getByText(/indicative pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/file for free with filesmart/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /file for free/i })[0]).toHaveAttribute("href", "/onboarding");
  });
});
