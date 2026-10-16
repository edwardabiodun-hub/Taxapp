import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getAllByRole("button", { name: "Learn about Commissions and bonuses" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("textbox", { name: "Commissions" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Bonuses" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Allowances" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Business income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Rent income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Foreign income" })).toBeInTheDocument();
  });

  it("shows a sourced 2026 result and clears it if an input changes", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "1000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));
    expect(screen.getAllByText("30,000").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "2000000" } });
    expect(screen.queryAllByText("30,000")).toHaveLength(0);
  });

  it("explains why an employer vehicle cannot be estimated instead of showing a number", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "1000000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Company Vehicle Cost" }), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot estimate yet");
    expect(screen.queryAllByText("30,000")).toHaveLength(0);
  });
});
