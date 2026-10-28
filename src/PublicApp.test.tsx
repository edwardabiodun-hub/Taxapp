import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "@/contexts/AuthContext";
import { PublicRoutes } from "./PublicApp";

const mockedUseAuth = vi.mocked(useAuth);

describe("PublicRoutes", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
  });

  it("renders public pages while the authentication session is still loading", async () => {
    mockedUseAuth.mockReturnValue({ loading: true, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={["/"]}><PublicRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: /file for free with filesmart/i }, { timeout: 15000 })).toBeInTheDocument();
  });

  it("keeps pricing behind account creation for unauthenticated visitors", async () => {
    mockedUseAuth.mockReturnValue({ loading: false, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={["/pricing"]}><PublicRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Get ready for filing season." })).toBeInTheDocument();
    expect(screen.getByText(/you’ll need an account to view pricing/i)).toBeInTheDocument();
  });

  it("renders the evidence-first filing directory publicly", async () => {
    mockedUseAuth.mockReturnValue({ loading: false, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={["/filing-directory"]}><PublicRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: /know what has actually been verified/i })).toBeInTheDocument();
    expect(screen.getAllByText("Individual PIT filing").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Not verified yet").length).toBeGreaterThan(1);
  });

  it("renders the branded not-found page instead of redirecting unknown paths home", async () => {
    mockedUseAuth.mockReturnValue({ loading: false, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() });

    render(<MemoryRouter initialEntries={["/does-not-exist"]}><PublicRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: /we couldn’t find that page/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to FileSmart home" })).toHaveAttribute("href", "/");
  });

  it.each([
    ["/learn", /learn about your tax/i],
    ["/contact", /need help finding your next step/i],
    ["/privacy", /privacy/i],
    ["/filing-directory", /know what has actually been verified/i],
  ] as const)("renders an accessible H1 for public route %s", async (route, heading) => {
    mockedUseAuth.mockReturnValue({ loading: false, isUnlocked: false, isPasswordRecovery: false, signOut: vi.fn() });

    const view = render(<MemoryRouter initialEntries={[route]}><PublicRoutes /></MemoryRouter>);

    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(
      screen.queryAllByRole("navigation").length + screen.queryAllByRole("link", { name: /filesmart home/i }).length,
    ).toBeGreaterThan(0);
    view.unmount();
  });
});
