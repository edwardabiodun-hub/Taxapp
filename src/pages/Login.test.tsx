import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let hasProfile = false;
vi.mock("@/hooks/use-has-profile", () => ({
  useHasProfile: () => ({ loading: false, hasProfile }),
}));

const VALID_EMAIL = "amara@example.com";
const VALID_PASSWORD = "correct-password";
const fetchMock = vi.hoisted(() => vi.fn());

let currentSession: { access_token: string } | null = null;
const listeners: ((session: typeof currentSession) => void)[] = [];

function notify() {
  for (const cb of listeners) cb(currentSession);
}

vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: currentSession } })),
      setSession: vi.fn(async ({ access_token }: { access_token: string }) => {
        currentSession = { access_token };
        notify();
        return { data: { session: currentSession }, error: null };
      }),
      onAuthStateChange: vi.fn((cb: (event: string, session: typeof currentSession) => void) => {
        const wrapped = (session: typeof currentSession) => cb("SIGNED_IN", session);
        listeners.push(wrapped);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }),
      signOut: vi.fn(async () => {
        currentSession = null;
        notify();
      }),
    },
  },
}));

async function renderLogin() {
  const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");
  const { default: Login } = await import("./Login");

  function Harness() {
    const { isUnlocked } = useAuth();
    return isUnlocked ? <div>UNLOCKED</div> : <Login />;
  }

  render(
    <MemoryRouter>
      <AuthProvider>
        <Harness />
      </AuthProvider>
    </MemoryRouter>
  );

  // Let AuthProvider's initial getSession() check settle before the test
  // interacts with the form, so that resolution isn't an unwrapped act().
  await waitFor(() => expect(screen.getByPlaceholderText("amara@example.com")).toBeInTheDocument());
}

describe("Login", () => {
  beforeEach(() => {
    currentSession = null;
    listeners.length = 0;
    hasProfile = false;
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as { email: string; password: string };
      const valid = body.email === VALID_EMAIL && body.password === VALID_PASSWORD;
      return new Response(
        JSON.stringify(
          valid
            ? { data: { session: { access_token: "fake-token" }, user: { id: "user-1" } }, error: null }
            : { data: null, error: { message: "Invalid login credentials" } },
        ),
        { status: valid ? 200 : 401, headers: { "content-type": "application/json" } },
      );
    });
  });

  it("rejects incorrect credentials and stays locked", async () => {
    await renderLogin();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: VALID_EMAIL },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("UNLOCKED")).not.toBeInTheDocument();
  });

  it("unlocks the session with the correct credentials", async () => {
    await renderLogin();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: VALID_EMAIL },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => {
      expect(screen.getByText("UNLOCKED")).toBeInTheDocument();
    });
  });

  it("links to Create account and Forgot password", async () => {
    await renderLogin();

    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
  });

  it("shows the Create account link when no local profile exists on this device", async () => {
    hasProfile = false;
    await renderLogin();

    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/onboarding");
  });

  it("hides the Create account link when a local profile already exists on this device", async () => {
    hasProfile = true;
    await renderLogin();

    expect(screen.queryByRole("link", { name: /create account/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
  });
});
