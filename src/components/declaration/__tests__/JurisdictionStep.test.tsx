import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getJurisdictionCapability,
  listNigeriaJurisdictions,
} from "@/data/jurisdiction-registry";
import JurisdictionStep from "@/components/declaration/JurisdictionStep";

describe("JurisdictionStep", () => {
  it("renders all 37 jurisdictions and allows every jurisdiction to be selected", () => {
    const onSelect = vi.fn();

    render(
      <JurisdictionStep
        selectedCode=""
        onSelect={onSelect}
        capabilities={listNigeriaJurisdictions()}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(37);
    const lagos = screen.getByRole("button", { name: /Lagos/i });
    expect(lagos).toBeEnabled();
    fireEvent.click(lagos);
    expect(onSelect).toHaveBeenCalledWith("NG-LA");
    expect(screen.getByRole("button", { name: /Federal Capital Territory/i })).toBeEnabled();
  });

  it("filters jurisdictions by searchable label and mirrors registry readiness evidence", () => {
    const onSelect = vi.fn();
    const guidedCapability = {
      ...getJurisdictionCapability("NG-LA"),
      primaryReadiness: "Guided manual filing" as const,
      evidence: {
        template: {
          source: "https://example.test/lagos-guidance",
          effectiveFrom: "2026-01-01",
          verifiedAt: "2026-10-02",
          confidence: "high" as const,
        },
      },
    };

    render(
      <JurisdictionStep
        selectedCode="NG-LA"
        onSelect={onSelect}
        capabilities={[
          guidedCapability,
          ...listNigeriaJurisdictions().filter(
            (capability) => capability.jurisdictionCode !== "NG-LA",
          ),
        ]}
      />,
    );

    const search = screen.getByRole("searchbox", { name: /jurisdiction/i });
    fireEvent.change(search, { target: { value: "Lagos" } });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Lagos/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Guided manual filing")).toBeInTheDocument();
    expect(screen.getByText(/lagos-guidance/i)).toBeInTheDocument();
  });
});
