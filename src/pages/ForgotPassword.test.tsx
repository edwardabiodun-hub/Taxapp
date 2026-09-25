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
