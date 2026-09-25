import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let hasProfile = false;
let profileLoading = false;
vi.mock("@/hooks/use-has-profile", () => ({
  useHasProfile: () => ({ loading: profileLoading, hasProfile }),
}));

let isUnlocked = false;
let authLoading = false;
let isPasswordRecovery = false;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ loading: authLoading, isUnlocked, isPasswordRecovery, signOut: vi.fn() }),
}));

// AppRoutes' static import graph reaches Login.tsx, Onboarding.tsx,
// CheckEmail.tsx, ForgotPassword.tsx, ResetPassword.tsx, and
// ProfileMenu.tsx, every one of which imports a named export from
// "@/lib/auth" — which itself imports supabase-client.ts, and that throws
// at module-load time without real VITE_SUPABASE_* env vars. Mocking
// "@/lib/auth" wholesale (same reasoning as Onboarding.test.tsx's existing
// supabase-client mock) keeps this file from depending on those env vars
// being present, in CI or anywhere else.
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  resendConfirmationEmail: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

// The authenticated-routing test below renders Dashboard for real, which
// pulls in useSync() -> syncAll() -> real network calls via api.ts/
// supabase-client.ts. Left unmocked, a failed sync schedules a retry via
// setTimeout that outlives the test (and the render), producing an
// "error caught after test environment was torn down" failure reported
// against this file. Mock syncAll to resolve cleanly so no retry timer is
// ever scheduled.
vi.mock("@/lib/sync-service", () => ({
  syncAll: vi.fn(async () => ({ success: true })),
}));

async function renderAppRoutes(initialPath: string) {
  const { AppRoutes } = await import("./App");
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe("AppRoutes — unauthenticated routing", () => {
  beforeEach(() => {
    hasProfile = false;
    profileLoading = false;
    isUnlocked = false;
    authLoading = false;
    isPasswordRecovery = false;
  });

  it("sends a brand-new user (no profile, no session) to Welcome by default", async () => {
    hasProfile = false;
    isUnlocked = false;
    await renderAppRoutes("/some/unknown/path");

    expect(screen.getByText("Welcome to FileSmart")).toBeInTheDocument();
  });

  it("sends a returning logged-out user (has a local profile, no session) straight to Login", async () => {
    hasProfile = true;
    isUnlocked = false;
    await renderAppRoutes("/some/unknown/path");

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("keeps /forgot-password reachable even with no local profile", async () => {
    hasProfile = false;
    isUnlocked = false;
    await renderAppRoutes("/forgot-password");

    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
  });

  it("routes a PASSWORD_RECOVERY session straight to /reset-password ahead of the onboarding-forcing branch", async () => {
    hasProfile = false;
    isUnlocked = true;
    isPasswordRecovery = true;
    await renderAppRoutes("/");

    expect(screen.getByText("Set a new password")).toBeInTheDocument();
  });

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])(
    "sends a PASSWORD_RECOVERY session to /reset-password regardless of hasProfile=%s / isUnlocked=%s",
    async (profile, unlocked) => {
      hasProfile = profile;
      isUnlocked = unlocked;
      isPasswordRecovery = true;
      await renderAppRoutes("/");

      expect(screen.getByText("Set a new password")).toBeInTheDocument();
    }
  );
});

describe("AppRoutes — authenticated routing", () => {
  beforeEach(() => {
    hasProfile = true;
    profileLoading = false;
    isUnlocked = true;
    authLoading = false;
    isPasswordRecovery = false;
  });

  it("renders the main app, not a 404, when a session lands on the stale unauthenticated-only /login URL", async () => {
    // Regression test for the bug where signing in left the URL on /login —
    // AppRoutes had no route for it in the authenticated table, so its `*`
    // fallback rendered NotFound instead of redirecting to /.
    await renderAppRoutes("/login");

    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument();
    expect(screen.queryByText("404")).not.toBeInTheDocument();
  });
});
