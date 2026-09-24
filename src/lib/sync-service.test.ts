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
}));

describe("syncAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
