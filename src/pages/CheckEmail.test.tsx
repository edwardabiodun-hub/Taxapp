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
