import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { defaultNigeriaForm } from "@/types/declaration";
import { calculatePreparation } from "@/lib/calculation-service";
import ReviewStep from "@/components/declaration/ReviewStep";

describe("ReviewStep", () => {
  it("does not show a numeric tax estimate when preparation calculation is not filing-ready", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualSalary: "1000000" };
    const calculation = calculatePreparation(
      { ...form, jurisdictionCode: "NG-LA" },
      getJurisdictionCapability("NG-LA"),
    );

    expect(calculation.label).toBe("Not filing-ready");

    render(
      <ReviewStep
        form={form}
        capability={getJurisdictionCapability("NG-LA")}
        calculation={calculation}
      />,
    );

    expect(screen.queryByText("Tax Liability Estimate")).not.toBeInTheDocument();
    expect(screen.getAllByText("Not filing-ready").length).toBeGreaterThan(0);
  });
});
