import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENT, createAnalyticsEvent, trackEvent } from "./analytics";

describe("privacy-safe analytics contract", () => {
  it("keeps only allowlisted, bounded interaction metadata", () => {
    const event = createAnalyticsEvent("public_calculator_estimate_shown", {
      surface: "public_calculator",
      route: "/calculator",
      result: "estimate_shown",
      annualSalary: "2000000",
      email: "person@example.com",
      freeText: "ignore this",
    });

    expect(event.properties).toEqual({
      surface: "public_calculator",
      route: "/calculator",
      result: "estimate_shown",
    });
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.properties)).toBe(true);
  });

  it("emits a browser-local event without making a network request", () => {
    const listener = vi.fn();
    const fetchSpy = vi.spyOn(window, "fetch");
    window.addEventListener(ANALYTICS_EVENT, listener);

    trackEvent("public_calculator_viewed", {
      surface: "public_calculator",
      route: "/calculator",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      type: ANALYTICS_EVENT,
      detail: {
        name: "public_calculator_viewed",
        properties: { surface: "public_calculator", route: "/calculator" },
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    window.removeEventListener(ANALYTICS_EVENT, listener);
    fetchSpy.mockRestore();
  });
});
