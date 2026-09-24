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

describe("recordActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes a locally-pending activity row for the given declaration", async () => {
    const { db } = await import("./local-db");
    const { recordActivity } = await import("./activity-log");

    await recordActivity({
      declarationId: "decl-1",
      type: "created",
      title: "Declaration created",
      description: "Tax Year 2025",
    });

    const rows = await db.activities.where("declarationId").equals("decl-1").toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      declarationId: "decl-1",
      type: "created",
      title: "Declaration created",
      description: "Tax Year 2025",
      pendingSync: 1,
    });
    expect(rows[0].id).toBeTruthy();
    expect(rows[0].timestamp).toBeTruthy();
  });

  it("stores optional meta when provided", async () => {
    const { db } = await import("./local-db");
    const { recordActivity } = await import("./activity-log");

    await recordActivity({
      declarationId: "decl-2",
      type: "document_upload",
      title: "1 document uploaded",
      meta: { count: 1 },
    });

    const rows = await db.activities.where("declarationId").equals("decl-2").toArray();
    expect(rows[0].meta).toEqual({ count: 1 });
  });
});
