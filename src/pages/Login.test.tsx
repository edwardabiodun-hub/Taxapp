import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

async function renderLogin() {
  const { AuthProvider, useAuth } = await import("@/contexts/AuthContext");
  const { default: Login } = await import("./Login");

  function Harness() {
    const { isUnlocked } = useAuth();
    return isUnlocked ? <div>UNLOCKED</div> : <Login />;
  }

  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );
}

describe("Login", () => {
  it("rejects incorrect credentials and stays locked", async () => {
    const { createAccount } = await import("@/lib/auth");
    await createAccount("amara@example.com", "correct-password");

    await renderLogin();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: "amara@example.com" },
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
    const { createAccount } = await import("@/lib/auth");
    await createAccount("amara@example.com", "correct-password");

    await renderLogin();

    fireEvent.change(screen.getByPlaceholderText("amara@example.com"), {
      target: { value: "amara@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "correct-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));

    await waitFor(() => {
      expect(screen.getByText("UNLOCKED")).toBeInTheDocument();
    });
  });
});
