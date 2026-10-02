import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { defaultNigeriaForm } from "@/types/declaration";
import DeductionsStep from "./DeductionsStep";

describe("DeductionsStep rent relief", () => {
  it("caps the rent base before applying the 20% relief rate", () => {
    render(
      <DeductionsStep
        form={{ ...defaultNigeriaForm, annualRentPaid: "10000000" }}
        update={vi.fn()}
      />,
    );

    expect(screen.getByText(/Relief: ₦100,000/)).toBeInTheDocument();
    expect(screen.getByText(/20% of ₦500,000 rent base/)).toBeInTheDocument();
    expect(screen.queryByText(/Relief: ₦2,000,000/)).not.toBeInTheDocument();
  });
});
