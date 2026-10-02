import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { TooltipProvider } from "@/components/ui/tooltip";
import TaxCalculator from "./TaxCalculator";

describe("TaxCalculator glossary integration", () => {
  it("adds glossary triggers to explanatory tax content", () => {
    render(
      <TooltipProvider>
        <MemoryRouter>
          <TaxCalculator />
        </MemoryRouter>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Learn about Personal income tax" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Chargeable income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Eligible deductions" })).toBeInTheDocument();
  });

  it("adds glossary triggers to calculator field terminology", () => {
    render(
      <TooltipProvider>
        <MemoryRouter>
          <TaxCalculator />
        </MemoryRouter>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Learn about Annual salary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Commissions and bonuses" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Allowances" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Business income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Rent income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Foreign income" })).toBeInTheDocument();
  });
});
