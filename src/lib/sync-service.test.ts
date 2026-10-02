import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aparajita/capacitor-secure-storage", () => {
  const store: Record<string, string> = {};
  return {
    SecureStorage: {
      get: vi.fn(async (key: string) => store[key] ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
    },
  };
});

vi.mock("./api", () => ({
  fetchProfileFromServer: vi.fn(),
  pushProfileToServer: vi.fn(async () => {}),
  fetchDeclarationsFromServer: vi.fn(async () => []),
  pushDeclarationsToServer: vi.fn(async () => {}),
  fetchActivitiesFromServer: vi.fn(async () => []),
  pushActivitiesToServer: vi.fn(async () => {}),
  fetchMessagesFromServer: vi.fn(async () => []),
  pushMessageReadStatus: vi.fn(async () => {}),
}));

describe("syncAll", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Unlike declarations/activities/profiles above (each exercised by only
    // one test in this file, so cross-test IndexedDB state never collides),
    // both new messages tests below write to db.messages and one asserts an
    // absolute row count — so leftover rows from a prior test would produce
    // a false failure. Clear it between tests, matching the pattern already
    // used in use-restore-profile.test.ts.
    const { db } = await import("./local-db");
    await db.messages.clear();
  });

  it("merges server profile data into the existing local profile instead of creating a duplicate", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.profiles.put({
      id: "user-real-123",
      name: "Amara Okafor",
      email: "amara@example.com",
      phone: "+2348123456789",
      taxId: "A012345678Z",
      country: "ng",
    });

    // Defensive case: even if the server ever returned a profile keyed by a
    // different id than the local record's (it shouldn't — both are the
    // authenticated user's real auth.users id — but this is exactly the
    // failure mode that used to happen with the old mock backend's
    // hardcoded fixture id, silently creating a permanent phantom profile).
    vi.mocked(api.fetchProfileFromServer).mockResolvedValue({
      id: "user-001",
      name: "Amara Okafor",
      email: "amara@example.com",
      phone: "+234 812 345 6789",
      taxId: "A012345678Z",
      country: "ng",
    });

    await syncAll();

    expect(await db.profiles.count()).toBe(1);
    const stillThere = await db.profiles.get("user-real-123");
    expect(stillThere).toBeDefined();
    expect(await db.profiles.get("user-001")).toBeUndefined();
  });

  it("does not clear the pendingSync flag on an edit made after the push snapshot was taken", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.declarations.put({
      id: "decl-race",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "draft",
      formData: { annualSalary: "100000" },
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: 1,
    });

    // Simulate a new local edit landing while the push request is in flight —
    // the push call itself has already captured its snapshot by this point.
    vi.mocked(api.pushDeclarationsToServer).mockImplementation(async () => {
      await db.declarations.update("decl-race", {
        formData: { annualSalary: "999999" },
        pendingSync: 1,
        updatedAt: new Date().toISOString(),
      });
    });

    await syncAll();

    const after = await db.declarations.get("decl-race");
    expect(after?.pendingSync).toBe(1);
    expect(after?.formData.annualSalary).toBe("999999");
  });

  it("pushes pending local activities to the server and clears their pendingSync flag", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.activities.put({
      id: "act-pending",
      declarationId: "decl-1",
      type: "created",
      title: "Declaration created",
      timestamp: new Date().toISOString(),
      pendingSync: 1,
    });

    await syncAll();

    expect(api.pushActivitiesToServer).toHaveBeenCalledWith([
      expect.objectContaining({ id: "act-pending" }),
    ]);
    const after = await db.activities.get("act-pending");
    expect(after?.pendingSync).toBe(0);
  });

  it("pushes a pending read-status change and clears pendingSync", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.messages.put({
      id: "msg-pending",
      category: "general",
      subject: "Welcome",
      body: "Thanks for signing up.",
      readAt: "2026-01-05T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 1,
    });

    await syncAll();

    expect(api.pushMessageReadStatus).toHaveBeenCalledWith("msg-pending", "2026-01-05T00:00:00.000Z");
    const after = await db.messages.get("msg-pending");
    expect(after?.pendingSync).toBe(0);
  });

  it("pulls messages from the server into local storage, updating an existing row rather than duplicating it", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    await db.messages.put({
      id: "msg-existing",
      category: "general",
      subject: "Old subject",
      body: "Old body",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    vi.mocked(api.fetchMessagesFromServer).mockResolvedValue([
      {
        id: "msg-existing",
        category: "document_request",
        subject: "We need a document from you",
        body: "Please upload your payslip.",
        createdAt: "2026-01-01T00:00:00.000Z",
        pendingSync: 0,
      },
    ]);

    await syncAll();

    expect(await db.messages.count()).toBe(1);
    const stored = await db.messages.get("msg-existing");
    expect(stored?.subject).toBe("We need a document from you");
  });

  it("does not let a stale server pull clobber a mark-read that lands mid-sync", async () => {
    const { db } = await import("./local-db");
    const api = await import("./api");
    const { syncAll } = await import("./sync-service");

    // The message starts NOT pending, so this syncAll() call's push step
    // (which runs first, and reads pendingSync=1 rows) finds nothing to
    // push for it — mirroring "its push step already ran and found
    // nothing pending" from the race scenario. The mark-read then lands
    // while the pull's network fetch is in flight (simulated here by
    // mutating local state inside fetchMessagesFromServer's own mock,
    // before it resolves with a stale server row for the same message).
    await db.messages.put({
      id: "msg-race",
      category: "general",
      subject: "Welcome",
      body: "Thanks for signing up.",
      createdAt: "2026-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    vi.mocked(api.fetchMessagesFromServer).mockImplementation(async () => {
      await db.messages.update("msg-race", {
        readAt: "2026-01-05T00:00:00.000Z",
        pendingSync: 1,
      });
      return [
        {
          id: "msg-race",
          category: "general",
          subject: "Welcome",
          body: "Thanks for signing up.",
          readAt: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          pendingSync: 0,
        },
      ];
    });

    await syncAll();

    // The pull's guard must have skipped overwriting the row once it saw
    // pendingSync: 1 — the local mark-read survives instead of being reset
    // to the stale server value (readAt: undefined). The next sync cycle
    // will push this pending change and then correctly pull the settled
    // state.
    const after = await db.messages.get("msg-race");
    expect(after?.readAt).toBe("2026-01-05T00:00:00.000Z");
    expect(after?.pendingSync).toBe(1);
  });
});
