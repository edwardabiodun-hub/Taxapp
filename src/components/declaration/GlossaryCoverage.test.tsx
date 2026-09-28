import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { defaultNigeriaForm } from "@/types/declaration";
import EarnedIncomeStep from "./EarnedIncomeStep";

describe("declaration glossary coverage", () => {
  it("annotates earned-income fields without changing the form controls", () => {
    const update = () => undefined;

    render(
      <TooltipProvider>
        <EarnedIncomeStep form={defaultNigeriaForm} update={update} />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Learn about Annual salary" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Learn about Allowances" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Learn about Business income" })).not.toBeInTheDocument();
    const salaryInput = screen.getAllByPlaceholderText("0.00")[0];
    expect(salaryInput).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Learn about Annual salary" }).closest("label")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Business" }));
    expect(screen.getByRole("button", { name: "Learn about Business income" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Foreign" }));
    expect(screen.getAllByRole("button", { name: "Learn about Foreign income" })).toHaveLength(2);
  });
});
