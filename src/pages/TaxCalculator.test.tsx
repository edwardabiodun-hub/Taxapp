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

    expect(screen.getByRole("heading", { level: 1, name: "Tax Estimator" })).toBeInTheDocument();
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
    expect(screen.getByRole("textbox", { name: "Annual Salary" })).toHaveAttribute("inputmode", "decimal");
    expect(screen.getByRole("textbox", { name: "Annual Salary" })).toHaveAttribute("aria-describedby", "tax-calculator-annual-salary-hint");
    expect(screen.getByRole("button", { name: "Learn about Allowances" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Business income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Rent income" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Foreign income" })).toBeInTheDocument();
  });

  it("shows a sourced 2026 result and clears it if an input changes", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "1000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));
    expect(screen.getAllByText("₦30,000").length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "2000000" } });
    expect(screen.queryAllByText("₦30,000")).toHaveLength(0);
  });

  it("calculates from a form submit so keyboard and button submission share one path", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "1000000" } });
    fireEvent.submit(screen.getByRole("form", { name: "2026 tax estimate calculator" }));

    expect(screen.getByRole("status")).toHaveTextContent("₦30,000");
  });

  it("explains why an employer vehicle cannot be estimated instead of showing a number", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "1000000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Company Vehicle Cost" }), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot estimate yet");
    expect(screen.queryAllByText("₦30,000")).toHaveLength(0);
  });

  it("explains that income is required without showing a false estimate", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);

    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter at least one income amount");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /join the filing waitlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue tax preparation/i })).not.toBeInTheDocument();
  });

  it("shows a zero-tax result when positive income falls within the zero-rate band", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);
    fireEvent.change(screen.getByRole("textbox", { name: "Annual Salary" }), { target: { value: "600000" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate 2026 estimate/ }));

    expect(screen.getByRole("status")).toHaveTextContent("₦0");
    expect(screen.getByRole("button", { name: /continue tax preparation/i })).toBeInTheDocument();
  });

  it("exposes review fact controls without requiring them for simple salary estimates", () => {
    render(<TooltipProvider><MemoryRouter><TaxCalculator /></MemoryRouter></TooltipProvider>);

    expect(screen.getByLabelText("Rent period start")).toBeInTheDocument();
    expect(screen.getByLabelText("Rent period end")).toBeInTheDocument();
    expect(screen.getByLabelText("Rent shared with others")).toBeInTheDocument();
    expect(screen.getByLabelText("Life-insurance premium paid year")).toBeInTheDocument();
    expect(screen.getByLabelText("Mortgage is for principal residence")).toBeInTheDocument();
    expect(screen.getByLabelText("Employment period")).toBeInTheDocument();
  });
});
