import { beforeEach, describe, expect, it, vi } from "vitest";

const channel = vi.hoisted(() => ({
  on: vi.fn(),
  subscribe: vi.fn(),
}));
const channelFactory = vi.hoisted(() => vi.fn(() => channel));
const removeChannel = vi.hoisted(() => vi.fn());
const supabase = vi.hoisted(() => ({ channel: channelFactory, removeChannel }));

vi.mock("./supabase-client", () => ({ supabase }));

describe("realtime sync", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    channel.on.mockImplementation(() => channel);
    channel.subscribe.mockReturnValue(channel);
    const { db } = await import("./local-db");
    await Promise.all([
      db.profiles.clear(),
      db.declarations.clear(),
      db.activities.clear(),
      db.messages.clear(),
    ]);
  });

  it("applies an owned declaration event incrementally", async () => {
    const { applyRealtimeChange } = await import("./realtime-sync");
    const { db } = await import("./local-db");

    await applyRealtimeChange(
      {
        table: "declarations",
        eventType: "INSERT",
        new: {
          id: "decl-1",
          user_id: "user-1",
          tax_year: "2025",
          country: "ng",
          state: "lagos",
          type: "Income Tax",
          status: "draft",
          form_data: { annualSalary: "100" },
          documents: [],
          amount: null,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        old: {},
      },
      "user-1"
    );

    expect(await db.declarations.get("decl-1")).toEqual(
      expect.objectContaining({ id: "decl-1", state: "lagos", pendingSync: 0 })
    );
  });

  it("rejects another user's payload and preserves pending local writes", async () => {
    const { applyRealtimeChange } = await import("./realtime-sync");
    const { db } = await import("./local-db");

    const row = {
      id: "decl-2",
      user_id: "other-user",
      tax_year: "2025",
      country: "ng",
      type: "Income Tax",
      status: "draft",
      form_data: {},
      documents: [],
      amount: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    await applyRealtimeChange({ table: "declarations", eventType: "INSERT", new: row, old: {} }, "user-1");
    expect(await db.declarations.get("decl-2")).toBeUndefined();

    await db.declarations.put({
      id: "decl-3",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "draft",
      formData: { annualSalary: "local" },
      documents: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pendingSync: 1,
    });
    await applyRealtimeChange(
      {
        table: "declarations",
        eventType: "UPDATE",
        new: { ...row, id: "decl-3", user_id: "user-1", form_data: { annualSalary: "server" } },
        old: {},
      },
      "user-1"
    );
    expect((await db.declarations.get("decl-3"))?.formData.annualSalary).toBe("local");
  });

  it("removes owned rows on DELETE and tears down the channel", async () => {
    const { applyRealtimeChange, subscribeToRealtime } = await import("./realtime-sync");
    const { db } = await import("./local-db");
    await db.messages.put({
      id: "msg-1",
      category: "general",
      subject: "Subject",
      body: "Body",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    await applyRealtimeChange(
      { table: "messages", eventType: "DELETE", new: {}, old: { id: "msg-1", recipient_user_id: "user-1" } },
      "user-1"
    );
    expect(await db.messages.get("msg-1")).toBeUndefined();

    const stop = subscribeToRealtime("user-1");
    expect(channel.on).toHaveBeenCalledTimes(4);
    expect(channel.subscribe).toHaveBeenCalledTimes(1);
    stop();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
