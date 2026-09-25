import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "PASSWORD_RECOVERY";
let authStateCallback: ((event: AuthEvent, session: { access_token: string } | null) => void) | undefined;

const authMock = {
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn((cb: typeof authStateCallback) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  signOut: vi.fn(),
};

vi.mock("@/lib/supabase-client", () => ({
  supabase: { auth: authMock },
}));

function Probe() {
  return null;
}

async function renderWithProvider() {
  const { AuthProvider, useAuth } = await import("./AuthContext");
  let captured: ReturnType<typeof useAuth> | undefined;
  function Capture() {
    captured = useAuth();
    return <Probe />;
  }
  render(
    <AuthProvider>
      <Capture />
    </AuthProvider>
  );
  // Let AuthProvider's initial getSession() promise settle (inside act())
  // before returning, so it doesn't resolve later and produce an
  // unwrapped-act() warning during a later assertion.
  await act(async () => {
    await Promise.resolve();
  });
  return () => captured!;
}

describe("AuthContext password recovery", () => {
  beforeEach(() => {
    authStateCallback = undefined;
    vi.clearAllMocks();
    authMock.getSession.mockResolvedValue({ data: { session: null } });
    // Real sessionStorage persists across tests within the same jsdom
    // window — clear it so one test's PASSWORD_RECOVERY write can't leak
    // into the next test's initial-mount read.
    window.sessionStorage.clear();
  });

  it("starts with isPasswordRecovery false", async () => {
    const getState = await renderWithProvider();
    expect(getState().isPasswordRecovery).toBe(false);
  });

  it("sets isPasswordRecovery true on a PASSWORD_RECOVERY event", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { access_token: "recovery-token" } } });
    const getState = await renderWithProvider();

    act(() => {
      authStateCallback!("PASSWORD_RECOVERY", { access_token: "recovery-token" });
    });

    expect(getState().isPasswordRecovery).toBe(true);
  });

  it("clears isPasswordRecovery on SIGNED_OUT", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { access_token: "recovery-token" } } });
    const getState = await renderWithProvider();

    act(() => {
      authStateCallback!("PASSWORD_RECOVERY", { access_token: "recovery-token" });
    });
    expect(getState().isPasswordRecovery).toBe(true);

    act(() => {
      authStateCallback!("SIGNED_OUT", null);
    });

    expect(getState().isPasswordRecovery).toBe(false);
  });

  it("removes the sessionStorage key on SIGNED_OUT", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { access_token: "recovery-token" } } });
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");
    const getState = await renderWithProvider();

    act(() => {
      authStateCallback!("PASSWORD_RECOVERY", { access_token: "recovery-token" });
    });
    expect(getState().isPasswordRecovery).toBe(true);

    act(() => {
      authStateCallback!("SIGNED_OUT", null);
    });

    expect(removeItemSpy).toHaveBeenCalledWith("fs_password_recovery");
    removeItemSpy.mockRestore();
  });

  it("seeds isPasswordRecovery true from sessionStorage on mount when a session is already present", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) =>
      key === "fs_password_recovery" ? "true" : null
    );
    authMock.getSession.mockResolvedValue({ data: { session: { access_token: "restored-token" } } });

    const getState = await renderWithProvider();

    expect(getState().isPasswordRecovery).toBe(true);
    vi.restoreAllMocks();
  });

  it("keeps isPasswordRecovery false when sessionStorage says true but there is no active session", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) =>
      key === "fs_password_recovery" ? "true" : null
    );
    authMock.getSession.mockResolvedValue({ data: { session: null } });

    const getState = await renderWithProvider();

    expect(getState().isPasswordRecovery).toBe(false);
    vi.restoreAllMocks();
  });
});
