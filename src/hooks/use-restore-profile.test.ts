import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const fetchProfileFromServerMock = vi.fn();
vi.mock("@/lib/api", () => ({
  fetchProfileFromServer: () => fetchProfileFromServerMock(),
}));

const SERVER_PROFILE = {
  id: "user-restore-1",
  name: "Amara Okafor",
  email: "amara@example.com",
  phone: "+234 812 345 6789",
  taxId: "A012345678Z",
  country: "ng",
};

describe("useRestoreProfile", () => {
  beforeEach(async () => {
    fetchProfileFromServerMock.mockReset();
    const { db } = await import("@/lib/local-db");
    await db.profiles.clear();
  });

  it("restores a profile the server already has into local storage", async () => {
    fetchProfileFromServerMock.mockResolvedValue(SERVER_PROFILE);
    const { useRestoreProfile } = await import("./use-restore-profile");
    const { db } = await import("@/lib/local-db");

    const { result } = renderHook(() => useRestoreProfile(true));

    expect(result.current.checking).toBe(true);

    await waitFor(() => expect(result.current.checking).toBe(false));

    const stored = await db.profiles.get("user-restore-1");
    expect(stored?.name).toBe("Amara Okafor");
    expect(stored?.taxId).toBe("A012345678Z");
  });

  it("writes nothing when the server has no profile for this account", async () => {
    fetchProfileFromServerMock.mockResolvedValue(null);
    const { useRestoreProfile } = await import("./use-restore-profile");
    const { db } = await import("@/lib/local-db");

    const { result } = renderHook(() => useRestoreProfile(true));

    await waitFor(() => expect(result.current.checking).toBe(false));

    expect(await db.profiles.count()).toBe(0);
  });

  it("never calls the server when shouldCheck is false", async () => {
    const { useRestoreProfile } = await import("./use-restore-profile");

    const { result } = renderHook(() => useRestoreProfile(false));

    expect(result.current.checking).toBe(false);
    expect(fetchProfileFromServerMock).not.toHaveBeenCalled();
  });

  it("does not leave checking stuck on true if the server call fails", async () => {
    fetchProfileFromServerMock.mockRejectedValue(new Error("network down"));
    const { useRestoreProfile } = await import("./use-restore-profile");

    const { result } = renderHook(() => useRestoreProfile(true));

    await waitFor(() => expect(result.current.checking).toBe(false));
  });
});
