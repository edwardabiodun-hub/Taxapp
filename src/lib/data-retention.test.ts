import { describe, it, expect } from "vitest";
import { isUnderRetentionHold, retentionHoldEndsAt } from "./data-retention";

describe("retentionHoldEndsAt", () => {
  it("computes the hold end as Jan 1, seven years after the tax year", () => {
    const endsAt = retentionHoldEndsAt({ taxYear: "2025" });
    expect(endsAt.toISOString()).toBe("2032-01-01T00:00:00.000Z");
  });
});

describe("isUnderRetentionHold", () => {
  it("is under hold well within the six-year window", () => {
    const declaration = { taxYear: "2025", status: "submitted" as const };
    expect(isUnderRetentionHold(declaration, new Date("2027-06-01T00:00:00.000Z"))).toBe(true);
  });

  it("is no longer under hold once the window has fully elapsed", () => {
    const declaration = { taxYear: "2025", status: "submitted" as const };
    expect(isUnderRetentionHold(declaration, new Date("2032-01-02T00:00:00.000Z"))).toBe(false);
  });

  it("is still under hold one day before the boundary", () => {
    const declaration = { taxYear: "2025", status: "submitted" as const };
    expect(isUnderRetentionHold(declaration, new Date("2031-12-31T23:59:59.000Z"))).toBe(true);
  });

  it("is exactly at the boundary is no longer under hold (six full years have elapsed)", () => {
    const declaration = { taxYear: "2025", status: "submitted" as const };
    expect(isUnderRetentionHold(declaration, new Date("2032-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("stays under an indefinite hold while status is audit_request, regardless of tax year", () => {
    const declaration = { taxYear: "2010", status: "audit_request" as const };
    expect(isUnderRetentionHold(declaration, new Date("2026-09-24T00:00:00.000Z"))).toBe(true);
  });

  it("defaults `now` to the current time when not provided", () => {
    const declaration = { taxYear: "2025", status: "submitted" as const };
    // Sanity check only — this declaration should still be under hold today
    // (2026), since the six-year window hasn't elapsed yet.
    expect(isUnderRetentionHold(declaration)).toBe(true);
  });
});
