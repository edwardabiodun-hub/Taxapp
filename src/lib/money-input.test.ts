import { describe, expect, it } from "vitest";
import { formatMoneyInput } from "./money-input";

describe("formatMoneyInput", () => {
  it("groups whole naira amounts with thousands separators", () => {
    expect(formatMoneyInput("3600000")).toBe("3,600,000");
  });

  it("preserves up to two decimal places", () => {
    expect(formatMoneyInput("1234567.89")).toBe("1,234,567.89");
  });

  it("removes invalid characters and returns empty input unchanged", () => {
    expect(formatMoneyInput("₦1a2,345")).toBe("12,345");
    expect(formatMoneyInput("  ")).toBe("");
  });
});
