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
