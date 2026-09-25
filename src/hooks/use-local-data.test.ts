import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

describe("useMessages", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("returns messages newest first", async () => {
    const { db } = await import("@/lib/local-db");
    const { useMessages } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-old",
      category: "general",
      subject: "Older",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-new",
      category: "general",
      subject: "Newer",
      body: "b",
      createdAt: "2026-01-02T00:00:00.000Z",
      pendingSync: 0,
    });

    const { result } = renderHook(() => useMessages());

    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current[0].id).toBe("msg-new");
    expect(result.current[1].id).toBe("msg-old");
  });
});

describe("useUnreadMessageCount", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("counts only messages with no readAt", async () => {
    const { db } = await import("@/lib/local-db");
    const { useUnreadMessageCount } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-unread",
      category: "general",
      subject: "Unread",
      body: "b",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-read",
      category: "general",
      subject: "Read",
      body: "b",
      readAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    const { result } = renderHook(() => useUnreadMessageCount());

    await waitFor(() => expect(result.current).toBe(1));
  });

  it("recomputes after a second message is marked read", async () => {
    const { db } = await import("@/lib/local-db");
    const { useUnreadMessageCount } = await import("./use-local-data");

    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2", category: "general", subject: "Two", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { result } = renderHook(() => useUnreadMessageCount());
    await waitFor(() => expect(result.current).toBe(2));

    await db.messages.update("msg-1", { readAt: "2026-01-03T00:00:00.000Z", pendingSync: 1 });
    await waitFor(() => expect(result.current).toBe(1));

    await db.messages.update("msg-2", { readAt: "2026-01-03T00:00:00.000Z", pendingSync: 1 });
    await waitFor(() => expect(result.current).toBe(0));
  });
});
