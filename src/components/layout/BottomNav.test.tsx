import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

describe("BottomNav", () => {
  beforeEach(async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.clear();
  });

  it("links to /messages as a nav item", async () => {
    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /messages/i })).toHaveAttribute("href", "/messages");
  });

  it("shows an unread-count badge matching the number of unread messages", async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });
    await db.messages.put({
      id: "msg-2", category: "general", subject: "Two", body: "b",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
  });

  it("shows no badge when every message is read", async () => {
    const { db } = await import("@/lib/local-db");
    await db.messages.put({
      id: "msg-1", category: "general", subject: "One", body: "b",
      readAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z", pendingSync: 0,
    });

    const { default: BottomNav } = await import("./BottomNav");
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toBeInTheDocument());
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
