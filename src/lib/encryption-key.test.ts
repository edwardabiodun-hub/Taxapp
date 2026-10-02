import { describe, it, expect, vi, beforeEach } from "vitest";

const secureStorageState: Record<string, string> = {};

vi.mock("@aparajita/capacitor-secure-storage", () => ({
  SecureStorage: {
    get: vi.fn(async (key: string) => secureStorageState[key] ?? null),
    set: vi.fn(async (key: string, value: string) => {
      secureStorageState[key] = value;
    }),
  },
}));

describe("getOrCreateDbKey", () => {
  beforeEach(() => {
    for (const key of Object.keys(secureStorageState)) delete secureStorageState[key];
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("generates and persists a new 32-byte key when none exists", async () => {
    const { getOrCreateDbKey } = await import("./encryption-key");
    const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");

    const key = await getOrCreateDbKey();

    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
    expect(SecureStorage.set).toHaveBeenCalledTimes(1);
  });

  it("returns the same key material on a second call without re-generating", async () => {
    const { getOrCreateDbKey } = await import("./encryption-key");
    const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");

    const first = await getOrCreateDbKey();
    const second = await getOrCreateDbKey();

    expect(second).toEqual(first);
    expect(SecureStorage.set).toHaveBeenCalledTimes(1);
  });

  it("reuses a key already stored from a previous app run", async () => {
    const { getOrCreateDbKey: firstRun } = await import("./encryption-key");
    const generated = await firstRun();

    vi.resetModules();
    vi.clearAllMocks(); // clear firstRun's one legitimate `set` call before asserting on secondRun

    const { getOrCreateDbKey: secondRun } = await import("./encryption-key");
    const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");
    const reloaded = await secondRun();

    expect(reloaded).toEqual(generated);
    expect(SecureStorage.set).not.toHaveBeenCalled();
  });
});
