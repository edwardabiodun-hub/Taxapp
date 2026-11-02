import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import PayeCalculator from "./PayeCalculator";

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
    const salary = screen.getByRole("textbox", { name: "Monthly gross salary" });

    fireEvent.change(salary, { target: { value: "300000" } });

    expect(salary).toHaveValue("300,000");
    expect(screen.getByRole("status")).toHaveTextContent("₦36,500");
    expect(screen.getByRole("status")).toHaveTextContent("₦263,500");
  });

  it("includes actual employee contributions and PAYE credit in the estimate", () => {
    renderCalculator();

    fireEvent.change(screen.getByRole("textbox", { name: "Monthly gross salary" }), { target: { value: "300000" } });
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

  it("keeps estimate submission-free and exposes a clear next step", () => {
    renderCalculator();

    expect(screen.getByRole("link", { name: /join the filing waitlist/i })).toHaveAttribute("href", "/filing-waitlist");
    expect(screen.getByRole("link", { name: "Explore tax education" })).toHaveAttribute("href", "/learn");
    expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
  });
});
