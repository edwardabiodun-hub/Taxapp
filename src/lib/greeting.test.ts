// src/lib/greeting.test.ts
import { describe, it, expect } from "vitest";
import { getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("returns a morning greeting before noon", () => {
    expect(getGreeting(6)).toBe("Good morning");
    expect(getGreeting(11)).toBe("Good morning");
  });

  it("returns an afternoon greeting from noon until 5pm", () => {
    expect(getGreeting(12)).toBe("Good afternoon");
    expect(getGreeting(16)).toBe("Good afternoon");
  });

  it("returns an evening greeting from 5pm onward, including late night", () => {
    expect(getGreeting(17)).toBe("Good evening");
    expect(getGreeting(23)).toBe("Good evening");
    expect(getGreeting(0)).toBe("Good evening");
    expect(getGreeting(4)).toBe("Good evening");
  });
});
