import { describe, expect, it } from "vitest";
import {
  getJurisdictionCapability,
  listNigeriaJurisdictions,
} from "@/data/jurisdiction-registry";

describe("Nigeria jurisdiction registry", () => {
  it("contains all 36 states and the FCT exactly once", () => {
    const entries = listNigeriaJurisdictions();

    expect(entries).toHaveLength(37);
    expect(new Set(entries.map((entry) => entry.jurisdictionCode)).size).toBe(37);
    expect(entries.some((entry) => entry.jurisdictionCode === "NG-FCT")).toBe(true);
  });

  it("fails closed for an unknown jurisdiction", () => {
    const capability = getJurisdictionCapability("NG-UNKNOWN");

    expect(capability.primaryReadiness).toBe("Not yet supported");
    expect(capability.ruleProfile.kind).toBe("generic_nigerian_pit");
  });
});
