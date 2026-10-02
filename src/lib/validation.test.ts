import { describe, it, expect } from "vitest";
import { validateStep } from "./validation";
import { defaultNigeriaForm, type NigeriaDeclarationForm } from "@/types/declaration";

function form(overrides: Partial<NigeriaDeclarationForm>): NigeriaDeclarationForm {
  return { ...defaultNigeriaForm, ...overrides };
}

describe("validateStep — step 0 (Country)", () => {
  it("requires a state when the country is Nigeria", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ng", state: "" }));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("State is required");
  });

  it("passes when tax year, country, and state are all provided", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ng", state: "lagos" }));

    expect(result.valid).toBe(true);
  });

  it("does not require a state for a non-Nigeria country", () => {
    const result = validateStep(0, form({ taxYear: "2025", country: "ke", state: "" }));

    expect(result.valid).toBe(true);
  });
});
