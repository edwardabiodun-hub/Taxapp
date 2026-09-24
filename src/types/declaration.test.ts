import { describe, it, expect } from "vitest";
import { nigerianStates, stateName, defaultNigeriaForm } from "./declaration";

describe("nigerianStates", () => {
  it("has exactly 37 entries with unique codes (36 states + FCT)", () => {
    expect(nigerianStates).toHaveLength(37);
    const codes = nigerianStates.map((s) => s.code);
    expect(new Set(codes).size).toBe(37);
  });

  it("activates exactly the four Phase 1 launch states", () => {
    const activeCodes = nigerianStates.filter((s) => s.active).map((s) => s.code).sort();
    expect(activeCodes).toEqual(["lagos", "ogun", "osun", "oyo"]);
  });
});

describe("stateName", () => {
  it("looks up a state's display name by code", () => {
    expect(stateName("lagos")).toBe("Lagos");
  });

  it("returns a placeholder for an unrecognized or missing code", () => {
    expect(stateName("not-a-real-state")).toBe("—");
    expect(stateName(undefined)).toBe("—");
  });
});

describe("defaultNigeriaForm", () => {
  it("defaults state to an empty string", () => {
    expect(defaultNigeriaForm.state).toBe("");
  });
});
