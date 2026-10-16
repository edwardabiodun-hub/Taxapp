import { describe, expect, it } from "vitest";
import { calculateRentRelief } from "./rent-relief";

describe("calculateRentRelief", () => {
  it.each([
    [0, 0],
    [250_000, 50_000],
    [500_000, 100_000],
    [1_000_000, 200_000],
    [2_500_000, 500_000],
    [10_000_000, 500_000],
    [-1, 0],
    [Number.NaN, 0],
  ])("returns relief of %i for annual rent %i", (annualRentPaid, expectedRelief) => {
    expect(calculateRentRelief(annualRentPaid).relief).toBe(expectedRelief);
  });
});
