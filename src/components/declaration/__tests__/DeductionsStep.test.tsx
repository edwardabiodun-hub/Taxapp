import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DeductionsStep from "../DeductionsStep";
import { defaultNigeriaForm } from "@/types/declaration";

describe("2026 statutory deduction inputs", () => {
  it("lets the user enter each supported amount without auto-claiming pension", () => {
    const update = vi.fn();
    render(<DeductionsStep form={{ ...defaultNigeriaForm, annualSalary: "5000000" }} update={update} />);
    for (const label of ["National Housing Fund", "National Health Insurance", "Owner-occupied mortgage interest", "Qualifying life-insurance or deferred-annuity premiums"]) {
      fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value: "100000" } });
      expect(update).toHaveBeenCalled();
    }
    expect(screen.queryByText(/Calculated.*8%/)).not.toBeInTheDocument();
  });
});
