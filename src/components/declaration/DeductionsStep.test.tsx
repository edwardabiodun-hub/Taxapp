import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { defaultNigeriaForm } from "@/types/declaration";
import DeductionsStep from "./DeductionsStep";

describe("DeductionsStep rent relief", () => {
  it("shows the statutory relief cap after applying the 20% rate", () => {
    render(
      <DeductionsStep
        form={{ ...defaultNigeriaForm, annualRentPaid: "10000000" }}
        update={vi.fn()}
      />,
    );

    expect(screen.getByText(/500,000 \(20% of 10,000,000 annual rent, relief capped at/)).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Naira" }).length).toBeGreaterThan(0);
  });

  it("captures the review facts needed for rent, mortgage, and insurance deductions", () => {
    render(
      <DeductionsStep
        form={{ ...defaultNigeriaForm }}
        update={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Rent period start")).toBeInTheDocument();
    expect(screen.getByLabelText("Rent period end")).toBeInTheDocument();
    expect(screen.getByLabelText("Rent shared with others")).toBeInTheDocument();
    expect(screen.getByLabelText("Life-insurance premium paid year")).toBeInTheDocument();
    expect(screen.getByLabelText("Mortgage is for principal residence")).toBeInTheDocument();
  });
});
