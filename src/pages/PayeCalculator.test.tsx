import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import PayeCalculator from "./PayeCalculator";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

const renderCalculator = () => render(
  <TooltipProvider>
    <MemoryRouter>
      <PayeCalculator />
    </MemoryRouter>
  </TooltipProvider>,
);

describe("PayeCalculator", () => {
  it("renders an employee-first calculator with an empty result state", () => {
    renderCalculator();

    expect(screen.getByRole("heading", { level: 1, name: /PAYE calculator/i })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "2026 PAYE calculator" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "PAYE calculation result" })).toHaveTextContent("Your PAYE estimate will appear here");
    expect(screen.getByText(/does not submit a return/i)).toBeInTheDocument();
  });

  it("formats salary input and updates the result without requiring a button click", () => {
    renderCalculator();
    const salary = screen.getByRole("textbox", { name: "Monthly gross pay" });

    fireEvent.change(salary, { target: { value: "300000" } });

    expect(salary).toHaveValue("300,000");
    expect(screen.getByRole("status")).toHaveTextContent("₦36,500");
    expect(screen.getByRole("status")).toHaveTextContent("₦263,500");
  });

  it("starts with simple gross pay and exposes itemised pay without changing the calculation contract", () => {
    renderCalculator();

    expect(screen.getByRole("radio", { name: "Simple gross pay" })).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Monthly gross pay" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Monthly commissions" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Itemise my pay" }));

    expect(screen.getByRole("textbox", { name: "Monthly gross salary" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Monthly commissions" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Monthly allowances" })).toBeInTheDocument();
  });

  it("keeps tax-impacting deductions neutral until the user enables and enters them", () => {
    renderCalculator();

    expect(screen.getByRole("button", { name: /adjust deductions/i })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Include pension contribution" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /adjust deductions/i }));

    const pension = screen.getByRole("switch", { name: "Include pension contribution" });
    expect(pension).not.toBeChecked();
    expect(screen.getByText(/actual employee contribution shown on your payslip/i)).toBeInTheDocument();

    fireEvent.click(pension);
    expect(pension).toBeChecked();
    expect(screen.getByRole("textbox", { name: "Monthly pension contribution" })).toBeInTheDocument();
  });

  it("shows the selected employment context as guidance only", () => {
    renderCalculator();

    expect(screen.getByRole("radio", { name: "Employee on PAYE" })).toBeChecked();
    expect(screen.getByText(/changes the guidance shown, not the baseline calculation/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Contractor or temporary worker" }));

    expect(screen.getByRole("radio", { name: "Contractor or temporary worker" })).toBeChecked();
  });

  it("includes actual employee contributions and PAYE credit in the estimate", () => {
    renderCalculator();

    fireEvent.click(screen.getByRole("radio", { name: "Itemise my pay" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Monthly gross salary" }), { target: { value: "300000" } });
    fireEvent.click(screen.getByRole("button", { name: /adjust deductions/i }));
    fireEvent.click(screen.getByRole("switch", { name: "Include pension contribution" }));
    fireEvent.click(screen.getByRole("switch", { name: "Include NHF contribution" }));
    fireEvent.click(screen.getByRole("switch", { name: "Include NHIS contribution" }));
    fireEvent.click(screen.getByRole("switch", { name: "Include PAYE already suffered" }));
    fireEvent.click(screen.getByRole("switch", { name: "Include rent relief" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Monthly pension contribution" }), { target: { value: "24000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Monthly NHF contribution" }), { target: { value: "2000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Monthly NHIS contribution" }), { target: { value: "4000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Monthly PAYE already suffered" }), { target: { value: "30000" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Annual rent paid" }), { target: { value: "1200000" } });

    expect(screen.getByRole("status")).toHaveTextContent("₦330,000");
    expect(screen.getByRole("status")).toHaveTextContent("₦27,500");
    expect(screen.getByRole("status")).toHaveTextContent("₦0");
    expect(screen.getByRole("status")).toHaveTextContent("₦242,500");
  });

  it("summarises the assumptions used in the live result", () => {
    renderCalculator();

    fireEvent.change(screen.getByRole("textbox", { name: "Monthly gross pay" }), { target: { value: "300000" } });

    expect(screen.getByRole("status")).toHaveTextContent(/documented deductions entered/i);
    expect(screen.getByRole("status")).toHaveTextContent(/tax year: 2026/i);
  });

  it("keeps estimate submission-free and exposes a clear next step", () => {
    renderCalculator();

    expect(screen.getByRole("link", { name: /join the filing waitlist/i })).toHaveAttribute("href", "/filing-waitlist");
    expect(screen.getByRole("link", { name: "Explore tax education" })).toHaveAttribute("href", "/learn");
    expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
  });
});
