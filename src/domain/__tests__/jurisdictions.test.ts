import { describe, expect, it } from "vitest";
import {
  getJurisdictionCapability,
  listNigeriaJurisdictions,
} from "@/data/jurisdiction-registry";

describe("Nigeria jurisdiction registry", () => {
  it("contains all 36 states and the FCT exactly once", () => {
    const entries = listNigeriaJurisdictions();
    const expectedCodes = [
      "NG-AB",
      "NG-AD",
      "NG-AK",
      "NG-AN",
      "NG-BA",
      "NG-BY",
      "NG-BE",
      "NG-BO",
      "NG-CR",
      "NG-DE",
      "NG-EB",
      "NG-ED",
      "NG-EK",
      "NG-EN",
      "NG-GO",
      "NG-IM",
      "NG-JI",
      "NG-KD",
      "NG-KN",
      "NG-KT",
      "NG-KE",
      "NG-KO",
      "NG-KW",
      "NG-LA",
      "NG-NA",
      "NG-NI",
      "NG-OG",
      "NG-ON",
      "NG-OS",
      "NG-OY",
      "NG-PL",
      "NG-RI",
      "NG-SO",
      "NG-TA",
      "NG-YO",
      "NG-ZA",
      "NG-FCT",
    ];

    expect(entries).toHaveLength(37);
    expect(new Set(entries.map((entry) => entry.jurisdictionCode)).size).toBe(37);
    expect(entries.map((entry) => entry.jurisdictionCode)).toEqual(expectedCodes);
    expect(entries.some((entry) => entry.jurisdictionCode === "NG-FCT")).toBe(true);
  });

  it("fails closed for an unknown jurisdiction", () => {
    const capability = getJurisdictionCapability("NG-UNKNOWN");

    expect(capability.primaryReadiness).toBe("Not yet supported");
    expect(capability.ruleProfile.kind).toBe("generic_nigerian_pit");
  });

  it("keeps the generic registry profile explicitly unconfigured", () => {
    const capability = getJurisdictionCapability("NG-LA");

    expect(capability.ruleProfile).toMatchObject({
      kind: "generic_nigerian_pit",
      profileId: "ng-pit-baseline",
      version: "",
      baseline: {
        status: "unconfigured",
        source: "",
        effectiveFrom: "",
        reviewedAt: "",
      },
    });
  });

  it("returns deeply immutable registry data", () => {
    const entries = listNigeriaJurisdictions();
    const first = entries[0];

    expect(Object.isFrozen(entries)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.ruleProfile)).toBe(true);
    expect(Object.isFrozen(first.deadlineProfile)).toBe(true);
    expect(Object.isFrozen(first.submissionModes)).toBe(true);
    expect(Object.isFrozen(first.exportFormats)).toBe(true);
  });
});
