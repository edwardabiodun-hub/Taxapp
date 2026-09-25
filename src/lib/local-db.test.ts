import { describe, it, expect, vi } from "vitest";

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

async function readRawProfile(id: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open("TaxEaseAfrica");
    openReq.onsuccess = () => {
      const idb = openReq.result;
      const tx = idb.transaction("profiles", "readonly");
      const getReq = tx.objectStore("profiles").get(id);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

async function readRawMessage(id: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open("TaxEaseAfrica");
    openReq.onsuccess = () => {
      const idb = openReq.result;
      const tx = idb.transaction("messages", "readonly");
      const getReq = tx.objectStore("messages").get(id);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

describe("local-db (real app database)", () => {
  it("encrypts profile PII at rest but leaves id/country plaintext and queryable", async () => {
    const { db } = await import("./local-db");

    await db.profiles.put({
      id: "profile-test-1",
      name: "Amara Okafor",
      email: "amara@example.com",
      phone: "+234 812 345 6789",
      taxId: "A012345678Z",
      country: "ng",
    });

    const raw = await readRawProfile("profile-test-1");
    expect(raw.name).toMatch(/^enc:v1:/);
    expect(raw.email).toMatch(/^enc:v1:/);
    expect(raw.id).toBe("profile-test-1");
    expect(raw.country).toBe("ng");

    const decrypted = await db.profiles.get("profile-test-1");
    expect(decrypted?.name).toBe("Amara Okafor");
    expect(decrypted?.email).toBe("amara@example.com");
  });

  it("supports the exact query patterns use-has-profile and sync-service rely on", async () => {
    const { db } = await import("./local-db");

    expect(await db.profiles.count()).toBeGreaterThanOrEqual(0);

    await db.declarations.put({
      id: "decl-test-1",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "draft",
      formData: { annualSalary: "900000" },
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: 1,
    });

    const pending = await db.declarations.where("pendingSync").equals(1).toArray();
    expect(pending.some((d) => d.id === "decl-test-1")).toBe(true);
    expect(pending.find((d) => d.id === "decl-test-1")?.formData).toEqual({
      annualSalary: "900000",
    });

    await db.declarations.where("pendingSync").equals(1).modify({ pendingSync: 0 });
    const stillPending = await db.declarations.where("pendingSync").equals(1).toArray();
    expect(stillPending.some((d) => d.id === "decl-test-1")).toBe(false);
  });

  it("encrypts message subject/body at rest but leaves category/pendingSync plaintext and queryable", async () => {
    const { db } = await import("./local-db");

    await db.messages.put({
      id: "msg-test-1",
      category: "refund_status",
      subject: "Your refund is on its way",
      body: "We've approved your 2025 refund of NGN 45,200.",
      createdAt: new Date().toISOString(),
      pendingSync: 0,
    });

    const raw = await readRawMessage("msg-test-1");
    expect(raw.subject).toMatch(/^enc:v1:/);
    expect(raw.body).toMatch(/^enc:v1:/);
    expect(raw.category).toBe("refund_status");
    expect(raw.pendingSync).toBe(0);

    const decrypted = await db.messages.get("msg-test-1");
    expect(decrypted?.subject).toBe("Your refund is on its way");
    expect(decrypted?.body).toBe("We've approved your 2025 refund of NGN 45,200.");
  });
});
