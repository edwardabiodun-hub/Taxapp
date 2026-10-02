import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const signOutMock = vi.fn(async () => {});
vi.mock("@/lib/auth", () => ({
  signOut: () => signOutMock(),
}));

const requestAccountDeletionMock = vi.fn();
vi.mock("@/lib/account-deletion", () => ({
  requestAccountDeletion: () => requestAccountDeletionMock(),
}));

async function renderMenu() {
  const { default: ProfileMenu } = await import("./ProfileMenu");
  render(
    <MemoryRouter>
      <ProfileMenu />
    </MemoryRouter>
  );
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out when Sign Out is clicked", async () => {
    await renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(signOutMock).toHaveBeenCalled());
  });

  it("does not delete the account until the confirmation dialog is confirmed", async () => {
    await renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));

    expect(await screen.findByText(/delete your account\?/i)).toBeInTheDocument();
    expect(requestAccountDeletionMock).not.toHaveBeenCalled();
  });

  it("requests deletion and navigates to onboarding on confirm", async () => {
    requestAccountDeletionMock.mockResolvedValue({
      declarationsDeleted: [],
      declarationsRetained: [],
      declarationsFailed: [],
      profilePseudonymized: true,
    });
    await renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /delete account/i }));

    await waitFor(() => expect(requestAccountDeletionMock).toHaveBeenCalled());
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/onboarding"));
  });

  it("does not navigate away when some declarations fail to delete", async () => {
    requestAccountDeletionMock.mockResolvedValue({
      declarationsDeleted: [],
      declarationsRetained: [],
      declarationsFailed: ["decl-1"],
      profilePseudonymized: false,
    });
    await renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /delete account/i }));

    await waitFor(() => expect(requestAccountDeletionMock).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
