import { describe, it, expect } from "vitest";
import { JURISDICTIONS } from "./jurisdictions";

describe("JURISDICTIONS", () => {
  it("registers exactly the four launch states", () => {
    expect(Object.keys(JURISDICTIONS).sort()).toEqual(["lagos", "ogun", "osun", "oyo"]);
  });

  it("has no overrides on any launch state yet, since none has a confirmed exception", () => {
    for (const jurisdiction of Object.values(JURISDICTIONS)) {
      expect(jurisdiction.overrides).toBeUndefined();
    }
  });
});
