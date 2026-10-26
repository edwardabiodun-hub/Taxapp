import { afterEach, describe, expect, it, vi } from "vitest";

describe("launch filing gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps the app's filing workflow available unless the website explicitly enables the launch gate", async () => {
    vi.stubEnv("VITE_FILING_LAUNCH_PHASE", "");
    vi.resetModules();
    expect((await import("./launch-phase")).isFilingLaunchPhase).toBe(false);
  });

  it("enables the website waitlist when explicitly configured", async () => {
    vi.stubEnv("VITE_FILING_LAUNCH_PHASE", "true");
    vi.resetModules();
    expect((await import("./launch-phase")).isFilingLaunchPhase).toBe(true);
  });
});
