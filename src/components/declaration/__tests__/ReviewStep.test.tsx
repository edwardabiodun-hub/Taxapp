import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { defaultNigeriaForm } from "@/types/declaration";
import { calculatePreparation } from "@/lib/calculation-service";
import ReviewStep from "@/components/declaration/ReviewStep";

describe("ReviewStep", () => {
  it("distinguishes annual rent paid from the calculated relief", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualRentPaid: "1,000,000" };
    const calculation = calculatePreparation(
      { ...form, jurisdictionCode: "NG-LA" },
      getJurisdictionCapability("NG-LA"),
    );

    render(<ReviewStep form={form} calculation={calculation} />);

    expect(screen.getByText("Annual Rent Paid")).toBeInTheDocument();
    expect(screen.getByText("Potential rent relief (subject to validation)").parentElement?.parentElement).toHaveTextContent("200,000");
  });

  it("does not show a numeric tax estimate for an unclassified benefit", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualSalary: "1000000", companyVehicleCost: "100000" };
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
    expect(screen.getByText(/Company vehicle ownership or hire details/)).toBeInTheDocument();
  });

  it("shows a 2026 sourced estimate without CRA or minimum tax", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualSalary: "1000000" };
    const calculation = calculatePreparation({ ...form, jurisdictionCode: "NG-LA" }, getJurisdictionCapability("NG-LA"));
    render(<ReviewStep form={form} calculation={calculation} />);
    expect(screen.getByText("Tax Liability Estimate")).toBeInTheDocument();
    expect(screen.queryByText(/Minimum Tax/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CRA/)).not.toBeInTheDocument();
  });

  it("does not render NaN as rent relief when a saved draft contains invalid rent", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualSalary: "1000000", annualRentPaid: "not-an-amount" };
    const calculation = calculatePreparation({ ...form, jurisdictionCode: "NG-LA" }, getJurisdictionCapability("NG-LA"));
    render(<ReviewStep form={form} calculation={calculation} />);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.getByText("Potential rent relief (subject to validation)").parentElement?.parentElement).toHaveTextContent("Needs review");
  });

  it("shows commissions and bonuses as distinct amounts", () => {
    const form = { ...defaultNigeriaForm, taxYear: "2026", annualSalary: "1000000", commissions: "120000", bonuses: "80000" };
    const calculation = calculatePreparation({ ...form, jurisdictionCode: "NG-LA" }, getJurisdictionCapability("NG-LA"));
    render(<ReviewStep form={form} calculation={calculation} />);
    expect(screen.getByText("Commissions").parentElement?.parentElement).toHaveTextContent("120000");
    expect(screen.getByText("Bonuses").parentElement?.parentElement).toHaveTextContent("80000");
  });

  it("shows review facts so unresolved deduction treatment is visible before saving", () => {
    const form = {
      ...defaultNigeriaForm,
      taxYear: "2026",
      annualSalary: "1000000",
      annualRentPaid: "1200000",
      rentPeriodStart: "2026-01-01",
      rentPeriodEnd: "2026-12-31",
      rentSharedWithOthers: "no",
      mortgagePrincipalResidence: "yes",
      lifeInsurancePremiumPaidYear: "2025",
      employmentPeriod: "full_year",
    };
    const calculation = calculatePreparation({ ...form, jurisdictionCode: "NG-LA" }, getJurisdictionCapability("NG-LA"));
    render(<ReviewStep form={form} calculation={calculation} />);

    expect(screen.getByText("2026-01-01 to 2026-12-31")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });
});
