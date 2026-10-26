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
});
