import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ResolvedDeadline } from "@/domain/deadlines";
import DeadlineCard from "@/components/deadlines/DeadlineCard";

const deadline: ResolvedDeadline = {
  taxYear: "2026",
  sourceKind: "national_baseline",
  label: "National statutory baseline — confirm with your tax authority",
  dueAt: "2026-01-03T00:00:00.000Z",
  source: "https://authority.example/deadlines",
  verifiedAt: "2025-12-01T00:00:00.000Z",
  confidence: "medium",
  effectiveFrom: "2025-01-01T00:00:00.000Z",
  timezone: "Africa/Lagos",
  isStale: false,
};

describe("DeadlineCard", () => {
  it("renders countdown provenance with a bounded meaningful live announcement", () => {
    const { container } = render(
      <DeadlineCard
        deadline={deadline}
        now={() => new Date("2026-01-01T00:00:00.000Z")}
      />,
    );

    expect(screen.getByText("Tax deadline")).toBeInTheDocument();
    expect(screen.getByText(/National statutory baseline/)).toBeInTheDocument();
    expect(screen.getByText(/2 days remaining/)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: medium/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified: 01 Dec 2025/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /deadline source/i })).toHaveAttribute(
      "href",
      deadline.source,
    );
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(/countdown available/i);
  });

  it("shows passed, stale, and offline indicators without negative countdown values", () => {
    render(
      <DeadlineCard
        deadline={{ ...deadline, isStale: true }}
        offline
        now={() => new Date("2026-01-04T00:00:00.000Z")}
      />,
    );

    expect(screen.getByText("Deadline passed")).toBeInTheDocument();
    expect(screen.getByText(/Stale source data/i)).toBeInTheDocument();
    expect(screen.getByText(/Offline — showing saved deadline data/i)).toBeInTheDocument();
    expect(screen.queryByText(/-\d/)).not.toBeInTheDocument();
  });

  it("shows an explicit unverified state when no deadline is available", () => {
    render(<DeadlineCard deadline={null} offline={false} />);

    expect(screen.getByText("Deadline not verified")).toBeInTheDocument();
    expect(
      screen.getByText(/No official filing deadline is available for this selection/i),
    ).toBeInTheDocument();
  });

  it("formats deadline and verification dates in the source timezone", () => {
    render(
      <DeadlineCard
        deadline={{
          ...deadline,
          dueAt: "2026-01-03T00:30:00.000Z",
          verifiedAt: "2025-12-01T00:30:00.000Z",
          timezone: "America/Los_Angeles",
        }}
        now={() => new Date("2026-01-01T00:00:00.000Z")}
      />,
    );

    expect(screen.getByText(/Based on the saved source date: 02 Jan 2026 \(America\/Los_Angeles\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified: 30 Nov 2025/i)).toBeInTheDocument();
  });

  it("falls back to UTC when the source timezone is invalid", () => {
    render(
      <DeadlineCard
        deadline={{ ...deadline, timezone: "Not/A-Timezone" }}
        now={() => new Date("2026-01-01T00:00:00.000Z")}
      />,
    );

    expect(screen.getByText(/Based on the saved source date: 03 Jan 2026 \(UTC\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified: 01 Dec 2025/i)).toBeInTheDocument();
  });

  it("cleans up its boundary timer and never schedules an interval", () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(
      <DeadlineCard
        deadline={deadline}
        now={() => new Date("2026-01-01T00:00:00.000Z")}
      />,
    );

    fireEvent(window, new Event("online"));
    unmount();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    setIntervalSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
});
