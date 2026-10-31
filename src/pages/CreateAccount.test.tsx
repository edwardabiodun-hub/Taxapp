import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ loading: false, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() }),
}));

vi.mock("@/lib/supabase-client", () => {
  throw new Error("Supabase is not configured for the public page");
});

import CreateAccount from "./CreateAccount";

describe("CreateAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without requiring Supabase configuration before submission", () => {
    render(<MemoryRouter><CreateAccount /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });
});
