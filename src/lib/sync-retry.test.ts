import { describe, expect, it } from "vitest";
import { MAX_SYNC_RETRIES, getRetryDelay } from "./sync-retry";

describe("sync retry policy", () => {
  it("allows a finite number of exponential retries and then stops", () => {
    expect(MAX_SYNC_RETRIES).toBe(3);
    expect(getRetryDelay(0)).toBe(5_000);
    expect(getRetryDelay(1)).toBe(10_000);
    expect(getRetryDelay(2)).toBe(20_000);
    expect(getRetryDelay(3)).toBeNull();
    expect(getRetryDelay(99)).toBeNull();
  });
});
