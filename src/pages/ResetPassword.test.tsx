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
