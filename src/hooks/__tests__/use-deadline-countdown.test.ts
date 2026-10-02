import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResolvedDeadline } from "@/domain/deadlines";
import { useDeadlineCountdown } from "@/hooks/use-deadline-countdown";

const deadline: ResolvedDeadline = {
  taxYear: "2026",
  sourceKind: "national_baseline",
  label: "National statutory baseline — confirm with your tax authority",
  dueAt: "2026-01-04T10:00:00.000Z",
  source: "https://authority.example/deadlines",
  verifiedAt: "2025-12-01T00:00:00.000Z",
  effectiveFrom: "2025-01-01T00:00:00.000Z",
  confidence: "medium",
  timezone: "Africa/Lagos",
  isStale: false,
};

describe("useDeadlineCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates at the actual deadline-relative day boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    const { result } = renderHook(() => useDeadlineCountdown(deadline));
    expect(result.current.days).toBe(2);
    expect(result.current.hours).toBe(22);

    act(() => {
      vi.advanceTimersByTime(22 * 60 * 60 * 1000);
    });

    expect(result.current.days).toBe(1);
    expect(result.current.hours).toBe(0);
  });
});
