# Welcome Screen, Auth Routing, Email Verification & Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app a real entry screen (the "Welcome to FileSmart" mockup), wire it to Sign In and Sign Up, replace the buried "check your email" toast with a dedicated screen, and add a full forgot-password / reset-password flow.

**Architecture:** Replace `App.tsx`'s if/else direct-render gating with a real unauthenticated route table (`/welcome`, `/login`, `/onboarding`, `/check-email`, `/forgot-password`, `/reset-password`) mounted whenever there's no active session, so these pages are reachable regardless of whether a local device profile exists — this matters because password reset must work even on a device that's never completed onboarding. A new `isPasswordRecovery` flag on `AuthContext` (driven by Supabase's `PASSWORD_RECOVERY` auth event) takes priority over every other branch, so a user who opens a reset-password email link is never swept into onboarding or the main app before they've set a new password.

**Tech Stack:** React + TypeScript, Vite, react-router-dom, Supabase Auth (`@supabase/supabase-js` v2), shadcn/ui + Tailwind, Vitest + Testing Library.

**Spec:** [docs/superpowers/specs/2026-09-24-welcome-auth-flow-design.md](../specs/2026-09-24-welcome-auth-flow-design.md)

## Global Constraints

- Combined signup wizard stays combined — `Onboarding.tsx` still collects email/password + full profile in one flow. Do not split it.
- Forgot Password never reveals whether a submitted email is registered — identical success UI either way.
- `/forgot-password` and `/reset-password` must be reachable whenever there's no active session, regardless of whether a local Dexie profile exists on this device.
- The `!hasProfile && isUnlocked` (reinstall) branch in `App.tsx` is unchanged — out of scope.
- No Capacitor deep-link handling for `/reset-password` — the web redirect (`window.location.origin`) is the only target for this plan.

## Review Focus

- Visiting `/check-email` with no route state (direct navigation, or a page refresh, which drops React Router state) must show fallback copy and hide the Resend button, not crash on `undefined`.
- Opening `/reset-password` with an expired or already-used recovery link must show an explicit error state directing back to `/forgot-password`, not silently fall through to onboarding or the dashboard.
- A `PASSWORD_RECOVERY` session must take priority over every other `App.tsx` branch — it must not be swept into the `!hasProfile && isUnlocked` onboarding-forcing branch or straight into the main app.
- Submitting Forgot Password twice in quick succession (double-click) must not fire two `resetPasswordForEmail` calls — the button disables while the request is in flight.
- The existing `needsEmailConfirmation: false` signup path (Supabase email confirmation turned off) must keep going straight into the app (`path: "/"`, no extra state), unaffected by the new `/check-email` redirect that only fires when `needsEmailConfirmation: true`.

---

## Task 1: Auth wrappers — resend, reset, update password

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Produces: `resendConfirmationEmail(email: string): Promise<AuthResult>`, `resetPasswordForEmail(email: string, redirectTo: string): Promise<AuthResult>`, `updatePassword(password: string): Promise<AuthResult>` — all reuse the existing `AuthResult` type (`{ success: boolean; error?: string }`, ignoring the `needsEmailConfirmation`/`userId` fields these calls don't produce).

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/auth.test.ts`, inside the existing `authMock` object add the three new mocked methods, and add three new `describe` blocks:

```ts
const authMock = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
};
```

```ts
  describe("resendConfirmationEmail", () => {
    it("resends the signup confirmation email", async () => {
      authMock.resend.mockResolvedValue({ error: null });
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("Amara@Example.com");

      expect(result.success).toBe(true);
      expect(authMock.resend).toHaveBeenCalledWith({ type: "signup", email: "amara@example.com" });
    });

    it("returns the error message when Supabase rejects the resend", async () => {
      authMock.resend.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("amara@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("resetPasswordForEmail", () => {
    it("requests a reset email with the given redirect", async () => {
      authMock.resetPasswordForEmail.mockResolvedValue({ error: null });
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("Amara@Example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(true);
      expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith("amara@example.com", {
        redirectTo: "https://app.example.com/reset-password",
      });
    });

    it("returns the error message when Supabase rejects the request", async () => {
      authMock.resetPasswordForEmail.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("amara@example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("updatePassword", () => {
    it("updates the current user's password", async () => {
      authMock.updateUser.mockResolvedValue({ data: { user: {} }, error: null });
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("new correct horse battery staple");

      expect(result.success).toBe(true);
      expect(authMock.updateUser).toHaveBeenCalledWith({ password: "new correct horse battery staple" });
    });

    it("returns the error message when Supabase rejects the update", async () => {
      authMock.updateUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth session missing" } });
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Auth session missing");
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL — `resendConfirmationEmail`, `resetPasswordForEmail`, `updatePassword` are not exported from `./auth`.

- [ ] **Step 3: Implement the three wrappers**

Add to the end of `src/lib/auth.ts`:

```ts
export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resend({ type: "signup", email: normalizeEmail(email) });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function resetPasswordForEmail(email: string, redirectTo: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: PASS — all `auth.test.ts` tests (existing `signUp`/`signIn` tests plus the six new ones) green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: add resend, reset, and update-password auth wrappers"
```

---

## Task 2: AuthContext — track password-recovery sessions

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Test: `src/contexts/AuthContext.test.tsx` (new)

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces: `useAuth()` now also returns `isPasswordRecovery: boolean` — `true` once Supabase's `onAuthStateChange` fires with event `"PASSWORD_RECOVERY"` (the browser landed on a valid, unexpired reset-password link), reset to `false` on a `"SIGNED_OUT"` event. `App.tsx` (Task 7) reads this to route `/reset-password` ahead of every other branch.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/AuthContext.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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
  return () => captured!;
}

describe("AuthContext password recovery", () => {
  beforeEach(() => {
    authStateCallback = undefined;
    vi.clearAllMocks();
    authMock.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("starts with isPasswordRecovery false", async () => {
    const getState = await renderWithProvider();
    expect(getState().isPasswordRecovery).toBe(false);
  });

  it("sets isPasswordRecovery true on a PASSWORD_RECOVERY event", async () => {
    const getState = await renderWithProvider();

    authStateCallback!("PASSWORD_RECOVERY", { access_token: "recovery-token" });

    expect(getState().isPasswordRecovery).toBe(true);
  });

  it("clears isPasswordRecovery on SIGNED_OUT", async () => {
    const getState = await renderWithProvider();

    authStateCallback!("PASSWORD_RECOVERY", { access_token: "recovery-token" });
    expect(getState().isPasswordRecovery).toBe(true);

    authStateCallback!("SIGNED_OUT", null);

    expect(getState().isPasswordRecovery).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/contexts/AuthContext.test.tsx`
Expected: FAIL — `isPasswordRecovery` is `undefined`, not `false`/`true`.

- [ ] **Step 3: Implement the flag**

Replace `src/contexts/AuthContext.tsx` with:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

interface AuthContextType {
  /** true while the initial session check hasn't resolved yet. */
  loading: boolean;
  /** true once a valid session exists — either just signed in, or restored
   * from Supabase's own persisted session cache (this is what makes
   * offline app-open work: no network round-trip needed for a still-valid
   * cached session). Unlike the PR #3 login gate this replaces, the app
   * does NOT require re-entering credentials on every restart — a signed-in
   * session stays signed in until it actually expires or the user signs
   * out, matching how session-backed auth normally behaves. */
  isUnlocked: boolean;
  /** true once Supabase reports a PASSWORD_RECOVERY event — the user just
   * landed on a valid reset-password email link, which the SDK turns into
   * a temporary session. This is distinct from a normal isUnlocked session
   * and must take routing priority over it: App.tsx checks this before
   * hasProfile/isUnlocked so a recovery session is never swept into
   * onboarding or straight into the main app. Cleared on sign-out, which
   * ResetPassword triggers once the new password is set. */
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true,
  isUnlocked: false,
  isPasswordRecovery: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading: session === undefined,
        isUnlocked: session != null,
        isPasswordRecovery,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/contexts/AuthContext.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx src/contexts/AuthContext.test.tsx
git commit -m "feat: track password-recovery sessions in AuthContext"
```

---

## Task 3: Welcome page

**Files:**
- Create: `src/pages/Welcome.tsx`
- Test: `src/pages/Welcome.test.tsx`

**Interfaces:**
- Consumes: `filesmart-icon.png` from `src/assets/` (existing asset).
- Produces: default-exported `Welcome` component, no props. Links to `/login` and `/onboarding` (both already exist as routable paths; Task 7 mounts `/login` for real — until then this page is tested standalone under a bare `MemoryRouter`).

- [ ] **Step 1: Write the failing test**

Create `src/pages/Welcome.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Welcome from "./Welcome";

describe("Welcome", () => {
  it("links Sign In to the login route and Create account to the signup wizard", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/onboarding");
  });

  it("shows the features list", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    expect(screen.getByText("Estimate your taxes")).toBeInTheDocument();
    expect(screen.getByText("Track your refund")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/Welcome.test.tsx`
Expected: FAIL — `src/pages/Welcome.tsx` doesn't exist.

- [ ] **Step 3: Implement Welcome.tsx**

Create `src/pages/Welcome.tsx`:

```tsx
import { Link } from "react-router-dom";
import { Calculator, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import filesmartIcon from "@/assets/filesmart-icon.png";

const features = [
  {
    icon: Calculator,
    title: "Estimate your taxes",
    description: "See what you owe before you file",
  },
  {
    icon: RefreshCcw,
    title: "Track your refund",
    description: "Follow your filing from submission to payout",
  },
];

const Welcome = () => (
  <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
    <div className="w-full max-w-sm flex-1 flex flex-col items-center text-center space-y-6">
      <img src={filesmartIcon} alt="FileSmart" className="h-14 w-14" />

      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl text-foreground">Welcome to FileSmart</h1>
        <p className="text-sm text-muted-foreground">
          Simple tools to file your taxes and track your refund
        </p>
      </div>

      <div className="w-full rounded-2xl gradient-primary h-40" aria-hidden="true" />

      <div className="w-full space-y-3 pt-2">
        <Button asChild className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90">
          <Link to="/login">Sign In</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          New to FileSmart?{" "}
          <Link to="/onboarding" className="text-primary font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>

      <div className="w-full pt-6 space-y-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Features</p>
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Welcome;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/Welcome.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Welcome.tsx src/pages/Welcome.test.tsx
git commit -m "feat: add Welcome landing page"
```

---

## Task 4: CheckEmail page

**Files:**
- Create: `src/pages/CheckEmail.tsx`
- Test: `src/pages/CheckEmail.test.tsx`

**Interfaces:**
- Consumes: `resendConfirmationEmail(email: string): Promise<AuthResult>` from Task 1's `src/lib/auth.ts`.
- Produces: default-exported `CheckEmail` component, no props — reads the signup email from `useLocation().state.email` (a `{ email?: string }` shape), set by `Onboarding.tsx` in Task 7.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/CheckEmail.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const resendMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  resendConfirmationEmail: (...args: unknown[]) => resendMock(...args),
}));

async function renderCheckEmail(email?: string) {
  const { default: CheckEmail } = await import("./CheckEmail");
  render(
    <MemoryRouter initialEntries={[{ pathname: "/check-email", state: email ? { email } : undefined }]}>
      <Routes>
        <Route path="/check-email" element={<CheckEmail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CheckEmail", () => {
  beforeEach(() => {
    resendMock.mockReset();
  });

  it("shows the submitted email and resends on click", async () => {
    resendMock.mockResolvedValue({ success: true });
    await renderCheckEmail("amara@example.com");

    expect(screen.getByText("amara@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resend email/i }));

    await waitFor(() => expect(resendMock).toHaveBeenCalledWith("amara@example.com"));
  });

  it("disables resend with a cooldown after a successful send", async () => {
    resendMock.mockResolvedValue({ success: true });
    await renderCheckEmail("amara@example.com");

    fireEvent.click(screen.getByRole("button", { name: /resend email/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resend email \(30s\)/i })).toBeDisabled();
    });
  });

  it("falls back to generic copy and hides Resend when reached with no route state", async () => {
    await renderCheckEmail();

    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/CheckEmail.test.tsx`
Expected: FAIL — `src/pages/CheckEmail.tsx` doesn't exist.

- [ ] **Step 3: Implement CheckEmail.tsx**

Create `src/pages/CheckEmail.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmationEmail } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const RESEND_COOLDOWN_SECONDS = 30;

const CheckEmail = () => {
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const result = await resendConfirmationEmail(email);
      if (!result.success) {
        toast({ title: "Couldn't resend the email", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Email sent", description: `Check ${email} for the confirmation link.` });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Confirm your email</h1>
          <p className="text-sm text-muted-foreground">
            {email ? (
              <>
                We sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>. Open it to activate your account.
              </>
            ) : (
              "Check your inbox for a confirmation link to activate your account."
            )}
          </p>
        </div>

        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full"
          >
            {cooldown > 0 ? `Resend email (${cooldown}s)` : resending ? "Sending…" : "Resend email"}
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CheckEmail;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/CheckEmail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CheckEmail.tsx src/pages/CheckEmail.test.tsx
git commit -m "feat: add CheckEmail verification screen"
```

---

## Task 5: ForgotPassword page

**Files:**
- Create: `src/pages/ForgotPassword.tsx`
- Test: `src/pages/ForgotPassword.test.tsx`

**Interfaces:**
- Consumes: `resetPasswordForEmail(email: string, redirectTo: string): Promise<AuthResult>` from Task 1.
- Produces: default-exported `ForgotPassword` component, no props.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/ForgotPassword.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const resetMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  resetPasswordForEmail: (...args: unknown[]) => resetMock(...args),
}));

async function renderForgotPassword() {
  const { default: ForgotPassword } = await import("./ForgotPassword");
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe("ForgotPassword", () => {
  beforeEach(() => resetMock.mockReset());

  it("sends a reset link and shows a confirmation, without revealing whether the email exists", async () => {
    resetMock.mockResolvedValue({ success: true });
    await renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: "amara@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
    expect(resetMock).toHaveBeenCalledWith("amara@example.com", expect.stringContaining("/reset-password"));
  });

  it("shows an error when the reset request fails", async () => {
    resetMock.mockResolvedValue({ success: false, error: "Too many requests" });
    await renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: "amara@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText("Too many requests")).toBeInTheDocument();
    });
  });

  it("disables the submit button while the request is in flight, preventing a double-submit", async () => {
    let resolveRequest: (value: { success: boolean }) => void = () => {};
    resetMock.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    await renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: "amara@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolveRequest({ success: true });
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/ForgotPassword.test.tsx`
Expected: FAIL — `src/pages/ForgotPassword.tsx` doesn't exist.

- [ ] **Step 3: Implement ForgotPassword.tsx**

Create `src/pages/ForgotPassword.tsx`:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { resetPasswordForEmail } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      const result = await resetPasswordForEmail(email, `${window.location.origin}/reset-password`);
      // Always show the same confirmation on success, whether or not the
      // email is registered — this can't be used to probe which emails
      // have accounts.
      if (!result.success) {
        setError(result.error ?? "Something went wrong. Please try again.");
        toast({ title: "Something went wrong", description: result.error, variant: "destructive" });
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="font-display font-bold text-xl text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a
            link to reset your password.
          </p>
          <Link to="/login" className="text-sm text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <Mail className="w-4 h-4 text-primary" /> Email
          </Label>
          <Input
            type="email"
            autoComplete="username"
            placeholder="amara@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(error && "border-destructive")}
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/ForgotPassword.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ForgotPassword.tsx src/pages/ForgotPassword.test.tsx
git commit -m "feat: add ForgotPassword page"
```

---

## Task 6: ResetPassword page

**Files:**
- Create: `src/pages/ResetPassword.tsx`
- Test: `src/pages/ResetPassword.test.tsx`

**Interfaces:**
- Consumes: `updatePassword(password: string): Promise<AuthResult>` from Task 1; `useAuth()`'s `isPasswordRecovery: boolean` and `signOut(): Promise<void>` from Task 2.
- Produces: default-exported `ResetPassword` component, no props. On a successful password update, calls `signOut()` then navigates to `/login`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/ResetPassword.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const updatePasswordMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  updatePassword: (...args: unknown[]) => updatePasswordMock(...args),
}));

const signOutMock = vi.fn();
let isPasswordRecovery = true;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isPasswordRecovery, signOut: signOutMock }),
}));

async function renderResetPassword() {
  const { default: ResetPassword } = await import("./ResetPassword");
  render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/forgot-password" element={<div>FORGOT PASSWORD PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ResetPassword", () => {
  beforeEach(() => {
    updatePasswordMock.mockReset();
    signOutMock.mockReset();
    isPasswordRecovery = true;
  });

  it("rejects a new password shorter than 8 characters without calling Supabase", async () => {
    await renderResetPassword();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation", async () => {
    await renderResetPassword();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "correct-password" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });

  it("updates the password, signs out, and returns to Sign In on success", async () => {
    updatePasswordMock.mockResolvedValue({ success: true });
    await renderResetPassword();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "correct-password" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument());
    expect(updatePasswordMock).toHaveBeenCalledWith("correct-password");
    expect(signOutMock).toHaveBeenCalled();
  });

  it("shows an error state with no update form when the recovery link is invalid or expired", async () => {
    isPasswordRecovery = false;
    await renderResetPassword();

    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
    expect(screen.getByText(/link .* expired|invalid/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute("href", "/forgot-password");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/ResetPassword.test.tsx`
Expected: FAIL — `src/pages/ResetPassword.tsx` doesn't exist.

- [ ] **Step 3: Implement ResetPassword.tsx**

Create `src/pages/ResetPassword.tsx`:

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updatePassword } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { isPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="font-display font-bold text-xl text-foreground">This link has expired</h1>
          <p className="text-sm text-muted-foreground">
            This reset-password link is invalid or has expired. Request a new one to continue.
          </p>
          <Link to="/forgot-password" className="text-sm text-primary font-medium hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        toast({ title: "Couldn't update your password", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Password updated", description: "Sign in with your new password." });
      await signOut();
      navigate("/login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="font-display font-bold text-xl text-foreground">Set a new password</h1>
          <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium text-card-foreground">
            <KeyRound className="w-4 h-4 text-primary" /> New password
          </Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(errors.password && "border-destructive")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="confirm-password"
            className="flex items-center gap-2 text-sm font-medium text-card-foreground"
          >
            <KeyRound className="w-4 h-4 text-primary" /> Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={cn(errors.confirmPassword && "border-destructive")}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/ResetPassword.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ResetPassword.tsx src/pages/ResetPassword.test.tsx
git commit -m "feat: add ResetPassword page"
```

---

## Task 7: Wire routing, Login links, and Onboarding's post-signup redirect

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Onboarding.tsx`
- Modify: `src/pages/Login.test.tsx`
- Modify: `src/pages/Onboarding.test.tsx`
- Test: `src/App.test.tsx` (new)

**Interfaces:**
- Consumes: `Welcome` (Task 3), `CheckEmail` (Task 4), `ForgotPassword` (Task 5), `ResetPassword` (Task 6), `useAuth().isPasswordRecovery` (Task 2).
- Produces: `AppRoutes` becomes a named export from `src/App.tsx` (alongside the existing default `App` export) so `App.test.tsx` can render it directly inside its own `MemoryRouter`, without the outer `BrowserRouter` `App` normally wraps it in. `Onboarding.tsx` gains a named export `resolvePostSignUpRoute(result: Pick<AuthResult, "needsEmailConfirmation">, email: string): { path: string; state?: { email: string } }`.

- [ ] **Step 1: Write the failing App.tsx routing tests**

Create `src/App.test.tsx`:

```tsx
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
```

`AuthProvider` isn't mocked because `AppRoutes` itself never imports it — only the outer `App` component does.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `AppRoutes` isn't exported from `./App`, and the routes it would need (`/welcome`, `/forgot-password`, `/reset-password` priority branch) don't exist yet.

- [ ] **Step 3: Rewrite App.tsx's routing**

Replace `src/App.tsx` with:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CountryThemeProvider } from "@/contexts/CountryThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHasProfile } from "@/hooks/use-has-profile";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import NewDeclaration from "./pages/NewDeclaration";
import Submissions from "./pages/Submissions";
import SubmissionDetail from "./pages/SubmissionDetail";
import Profile from "./pages/Profile";
import TaxCalculator from "./pages/TaxCalculator";
import Onboarding from "./pages/Onboarding";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import CheckEmail from "./pages/CheckEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
  </div>
);

export const AppRoutes = () => {
  const { loading: profileLoading, hasProfile } = useHasProfile();
  const { loading: authLoading, isUnlocked, isPasswordRecovery } = useAuth();

  if (profileLoading || authLoading) {
    return <LoadingScreen />;
  }

  // A password-recovery session (the user just opened a valid reset-password
  // email link) takes priority over every other branch below — otherwise a
  // device with no local profile would force this session into onboarding,
  // and a device that already has one would land in the main app, in both
  // cases before the user has had a chance to set their new password.
  if (isPasswordRecovery) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    );
  }

  // No local profile yet: this device has never completed onboarding.
  // Onboarding creates the Supabase account and the local profile together
  // (using the account's real user id), so there's no separate "has an
  // account" check — hasProfile doubles as that signal.
  if (!hasProfile && isUnlocked) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // No active session: whether or not a local profile exists, route through
  // the unauthenticated screens. /forgot-password and /reset-password stay
  // reachable regardless of hasProfile, since resetting a password is a
  // cross-device action that shouldn't depend on this device's local state.
  if (!isUnlocked) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to={hasProfile ? "/login" : "/welcome"} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/declare" element={<NewDeclaration />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="/submissions/:id" element={<SubmissionDetail />} />
        <Route path="/calculator" element={<TaxCalculator />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CountryThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </CountryThemeProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 4: Add Sign Up / Forgot Password links to Login.tsx**

In `src/pages/Login.tsx`, add the `Link` import and two links below the submit button:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
```

Replace the closing of the form (everything from the `<Button type="submit" ...>` through `</form>`) with:

```tsx
        <Button
          type="submit"
          disabled={checking}
          className="w-full gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90"
        >
          {checking ? "Checking…" : "Unlock"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/onboarding" className="text-primary font-medium hover:underline">
            Create account
          </Link>
          <Link to="/forgot-password" className="text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
```

- [ ] **Step 5: Update Login.test.tsx for the new links**

`Login.test.tsx` renders `<Login />` directly (not through `AppRoutes`), so it now needs a `MemoryRouter` around it for the new `Link`s to render without error. Update `renderLogin`'s `render(...)` call:

```tsx
import { MemoryRouter } from "react-router-dom";
```

```tsx
  render(
    <MemoryRouter>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </MemoryRouter>
  );
```

Add one new test at the end of the `describe("Login", ...)` block:

```tsx
  it("links to Create account and Forgot password", async () => {
    await renderLogin();

    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
  });
```

- [ ] **Step 6: Redirect Onboarding's post-signup flow to /check-email**

The two-way branch on `needsEmailConfirmation` (email-verification screen vs. straight into the app) is worth pinning with a direct unit test, but driving the full 3-step wizard through Radix's Select and Calendar components in jsdom is not reliable: neither is wired to its `Field` label via `htmlFor`/`aria-labelledby` (a pre-existing gap, out of scope here), and `Onboarding.test.tsx`'s own existing comment already documents that its tests deliberately stop at step 0 for this reason. Rather than add a fragile new UI test the plan can't verify in advance, extract the branching decision itself into a small pure function and unit-test that directly — the same technique the codebase already leans on elsewhere for keeping logic testable independent of the UI that calls it.

In `src/pages/Onboarding.tsx`, update the `signUp` import to also bring in the `AuthResult` type, and add an exported `resolvePostSignUpRoute` function above the `Onboarding` component:

```tsx
import { signUp, type AuthResult } from "@/lib/auth";
```

```tsx
/** Decides where Onboarding sends the user once signUp() resolves.
 * Exported and unit-tested directly (see Onboarding.test.tsx) rather than
 * only through the full 3-step wizard UI, which Radix's Select/Calendar
 * components make unreliable to drive in jsdom. */
export function resolvePostSignUpRoute(
  result: Pick<AuthResult, "needsEmailConfirmation">,
  email: string
): { path: string; state?: { email: string } } {
  if (result.needsEmailConfirmation) {
    // AuthContext won't see a session until the link is confirmed —
    // App.tsx will correctly show the unauthenticated routes (not the
    // main app) until then. Route to a dedicated screen rather than a
    // toast so the "activate your email" message survives navigation
    // and a page refresh.
    return { path: "/check-email", state: { email } };
  }
  return { path: "/" };
}
```

Then, inside `handleSubmit`, replace this exact block (`src/pages/Onboarding.tsx:152-162` as currently written):

```tsx
      if (result.needsEmailConfirmation) {
        // AuthContext won't see a session until the link is confirmed —
        // App.tsx will correctly show Login (not the main app) until then.
        toast({
          title: "Check your email",
          description: "Confirm your email to finish signing in, then log in below.",
        });
      } else {
        toast({ title: "Profile created!", description: "Welcome to FileSmart" });
      }
      navigate("/");
```

with:

```tsx
      const route = resolvePostSignUpRoute(result, form.email.trim());
      if (route.path === "/") {
        toast({ title: "Profile created!", description: "Welcome to FileSmart" });
      }
      navigate(route.path, route.state ? { state: route.state } : undefined);
```

- [ ] **Step 7: Add a unit test for resolvePostSignUpRoute**

Add to `src/pages/Onboarding.test.tsx`:

```tsx
describe("resolvePostSignUpRoute", () => {
  it("routes to /check-email with the submitted address when confirmation is required", async () => {
    const { resolvePostSignUpRoute } = await import("./Onboarding");

    expect(resolvePostSignUpRoute({ needsEmailConfirmation: true }, "amara@example.com")).toEqual({
      path: "/check-email",
      state: { email: "amara@example.com" },
    });
  });

  it("routes to / with no extra state when confirmation is not required", async () => {
    const { resolvePostSignUpRoute } = await import("./Onboarding");

    expect(resolvePostSignUpRoute({ needsEmailConfirmation: false }, "amara@example.com")).toEqual({
      path: "/",
    });
  });

  it("treats a missing needsEmailConfirmation as not required", async () => {
    const { resolvePostSignUpRoute } = await import("./Onboarding");

    expect(resolvePostSignUpRoute({}, "amara@example.com")).toEqual({ path: "/" });
  });
});
```

- [ ] **Step 8: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test file listed under `src/`, including the new `App.test.tsx`, `AuthContext.test.tsx`, `Welcome.test.tsx`, `CheckEmail.test.tsx`, `ForgotPassword.test.tsx`, `ResetPassword.test.tsx`, and the updated `Login.test.tsx` / `Onboarding.test.tsx`.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/pages/Login.tsx src/pages/Login.test.tsx src/pages/Onboarding.tsx src/pages/Onboarding.test.tsx
git commit -m "feat: wire Welcome/Login/Onboarding/CheckEmail/ForgotPassword/ResetPassword routing"
```

---

## Final verification

- [ ] Run `npx vitest run` once more from a clean state and confirm the whole suite is green.
- [ ] Run `npm run build` to confirm the TypeScript/Vite build succeeds with the new pages and routing.
