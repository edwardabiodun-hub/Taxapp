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
});
