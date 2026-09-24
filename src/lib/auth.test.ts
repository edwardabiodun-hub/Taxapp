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

async function readRawAuthRecord(): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open("TaxEaseAfrica");
    openReq.onsuccess = () => {
      const idb = openReq.result;
      const tx = idb.transaction("auth", "readonly");
      const getReq = tx.objectStore("auth").get("primary");
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

describe("auth", () => {
  it("reports no account before one is created", async () => {
    const { hasAccount } = await import("./auth");
    expect(await hasAccount()).toBe(false);
  });

  it("verifies the correct email/password after account creation", async () => {
    const { createAccount, verifyCredentials, hasAccount } = await import("./auth");

    await createAccount("amara@example.com", "correct horse battery staple");

    expect(await hasAccount()).toBe(true);
    expect(await verifyCredentials("amara@example.com", "correct horse battery staple")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const { createAccount, verifyCredentials } = await import("./auth");

    await createAccount("amara@example.com", "correct horse battery staple");

    expect(await verifyCredentials("amara@example.com", "wrong password")).toBe(false);
  });

  it("rejects an unknown email", async () => {
    const { createAccount, verifyCredentials } = await import("./auth");

    await createAccount("amara@example.com", "correct horse battery staple");

    expect(await verifyCredentials("someone-else@example.com", "correct horse battery staple")).toBe(false);
  });

  it("never stores the plaintext password", async () => {
    const { createAccount } = await import("./auth");

    await createAccount("amara@example.com", "correct horse battery staple");
    const raw = await readRawAuthRecord();

    expect(raw?.passwordHash).not.toBe("correct horse battery staple");
    expect(JSON.stringify(raw)).not.toContain("correct horse battery staple");
  });

  it("rejects credentials when no account has been created yet", async () => {
    const { verifyCredentials } = await import("./auth");
    expect(await verifyCredentials("anyone@example.com", "anything")).toBe(false);
  });
});
