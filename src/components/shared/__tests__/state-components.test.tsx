import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JurisdictionStep from "@/components/declaration/JurisdictionStep";
import { listNigeriaJurisdictions } from "@/data/jurisdiction-registry";
import ErrorState from "@/components/shared/ErrorState";

describe("shared UX states and keyboard behavior", () => {
  it("allows keyboard selection of a jurisdiction", () => {
    const onSelect = vi.fn();

    render(
      <JurisdictionStep
        selectedCode=""
        onSelect={onSelect}
        capabilities={listNigeriaJurisdictions()}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: /jurisdiction/i }), {
      target: { value: "Ogun" },
    });
    const ogun = screen.getByRole("button", { name: /Ogun/i });
    ogun.focus();
    fireEvent.keyDown(ogun, { key: "Enter", code: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("NG-OG");
  });

  it("renders a human-readable OCR error without provider details", () => {
    render(<ErrorState title="Receipt scanning unavailable" errorCode="OCR_UNAVAILABLE" />);

    expect(screen.getByText(/try manual entry/i)).toBeInTheDocument();
    expect(screen.queryByText(/stack|api key|provider/i)).not.toBeInTheDocument();
  });
});
