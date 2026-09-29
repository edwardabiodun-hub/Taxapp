import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { SyncProvider, useSync } from "./SyncContext";

const syncAll = vi.hoisted(() => vi.fn());
const subscribeToRealtime = vi.hoisted(() => vi.fn(() => vi.fn()));
const getUser = vi.hoisted(() => vi.fn(async () => ({ data: { user: null } })));

vi.mock("@/lib/sync-service", () => ({ syncAll }));
vi.mock("@/lib/realtime-sync", () => ({ subscribeToRealtime }), { virtual: true });
vi.mock("@/lib/supabase-client", () => ({
  supabase: { auth: { getUser } },
}));

function Probe({ label, onValue }: { label: string; onValue: (value: ReturnType<typeof useSync>) => void }) {
  const value = useSync();
  onValue(value);
  return <span data-testid={label}>{value.status}</span>;
}

describe("SyncProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncAll.mockResolvedValue({ success: true, auditRequests: [] });
    getUser.mockResolvedValue({ data: { user: null } });
  });

  it("shares one provider-owned runSync function across consumers", async () => {
    let first: ReturnType<typeof useSync> | undefined;
    let second: ReturnType<typeof useSync> | undefined;

    render(
      <SyncProvider>
        <Probe label="first" onValue={(value) => (first = value)} />
        <Probe label="second" onValue={(value) => (second = value)} />
      </SyncProvider>
    );

    await act(async () => {
      await first?.runSync();
    });

    expect(first?.runSync).toBe(second?.runSync);
    expect(syncAll).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("first")).toHaveTextContent("success");
  });

  it("stops scheduling after the finite retry budget is exhausted", async () => {
    vi.useFakeTimers();
    syncAll.mockResolvedValue({ success: false, error: "temporary failure" });
    let runSync: (() => Promise<void>) | undefined;

    render(
      <SyncProvider>
        <Probe label="status" onValue={(value) => (runSync = value.runSync)} />
      </SyncProvider>
    );

    await act(async () => {
      await runSync?.();
    });
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(syncAll).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });

  it("rebuilds the Realtime channel when connectivity returns", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    render(
      <SyncProvider>
        <Probe label="status" onValue={() => undefined} />
      </SyncProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(subscribeToRealtime).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await Promise.resolve();
    });

    expect(subscribeToRealtime).toHaveBeenCalledTimes(2);
  });
});
