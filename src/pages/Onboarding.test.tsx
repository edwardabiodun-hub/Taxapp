import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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

// Neither test here reaches handleSubmit (both stop at the step-0 consent
// gate), so this just needs to keep Onboarding's import chain — which now
// transitively touches supabase-client.ts — from depending on real
// VITE_SUPABASE_* env vars being present.
vi.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

async function renderOnboarding() {
  const { default: Onboarding } = await import("./Onboarding");
  const { AuthProvider } = await import("@/contexts/AuthContext");
  render(
    <MemoryRouter>
      <AuthProvider>
        <Onboarding />
      </AuthProvider>
    </MemoryRouter>
  );

  // Let AuthProvider's initial getSession() check settle before interacting
  // with the form, so that resolution isn't an unwrapped act().
  await waitFor(() => expect(screen.getByPlaceholderText("e.g. Amara Okafor")).toBeInTheDocument());
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Amara Okafor"), {
    target: { value: "Amara Okafor" },
  });
  fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
    target: { value: "amara@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("+234 812 345 6789"), {
    target: { value: "+2348123456789" },
  });
  fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), {
    target: { value: "correct-password" },
  });
  fireEvent.change(screen.getByPlaceholderText("Re-enter your password"), {
    target: { value: "correct-password" },
  });
}

describe("Onboarding consent gate", () => {
  it("blocks advancing past step 0 without accepting the privacy notice", async () => {
    await renderOnboarding();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/you must accept the privacy notice/i)).toBeInTheDocument();
    });
    // Still on step 0 — step 1's "Identity" heading must not be showing.
    expect(screen.queryByText("Identity")).not.toBeInTheDocument();
  });

  it("allows advancing once the privacy notice checkbox is checked", async () => {
    await renderOnboarding();
    fillRequiredFields();

    fireEvent.click(screen.getByRole("checkbox", { name: /i have read and agree/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Identity")).toBeInTheDocument();
    });
  });
});

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
