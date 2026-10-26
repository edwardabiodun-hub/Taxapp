import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useContextualSupportPrompt } from "./use-contextual-support-prompt";

describe("useContextualSupportPrompt", () => {
  it("waits for inactivity and cleans up the one-shot timer", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useContextualSupportPrompt(true, "declare"));

    expect(result.current.visible).toBe(false);
    act(() => vi.advanceTimersByTime(59_999));
    expect(result.current.visible).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.visible).toBe(true);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("dismisses for the rest of the session", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useContextualSupportPrompt(true, "declare-dismiss"));
    act(() => vi.advanceTimersByTime(60_000));
    act(() => result.current.dismiss());
    expect(result.current.visible).toBe(false);
    unmount();

    const second = renderHook(() => useContextualSupportPrompt(true, "declare-dismiss"));
    act(() => vi.advanceTimersByTime(60_000));
    expect(second.result.current.visible).toBe(false);
    second.unmount();
    vi.useRealTimers();
  });
});
