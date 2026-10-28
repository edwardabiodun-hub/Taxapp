import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../App";
import Landing from "./Landing";
import Privacy from "./Privacy";
import Terms from "./Terms";
import Disclaimer from "./Disclaimer";

vi.mock("@/hooks/use-has-profile", () => ({
  useHasProfile: () => ({ loading: false, hasProfile: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ loading: false, isUnlocked: false, isPasswordRecovery: false }),
}));

const legalPages = [
  { name: "privacy", heading: /privacy policy/i, Component: Privacy },
  { name: "terms", heading: /terms of use/i, Component: Terms },
  { name: "disclaimer", heading: /disclaimer/i, Component: Disclaimer },
] as const;

describe("public legal pages", () => {
  it.each(legalPages)("renders the $name page with confirmed operator details and the required draft-review notice", async ({ Component, heading }) => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByText("FileSmart BridgeIQ LTD")).toBeInTheDocument();
    expect(screen.getByText("Estate 10, Jordan Lane, Redemption City, Ogun State, Nigeria")).toBeInTheDocument();
    expect(screen.getAllByText("hello@filesmartnaija.com").length).toBeGreaterThan(0);
    expect(screen.getByText("Effective date: October 27, 2026")).toBeInTheDocument();
    expect(screen.getByText(/requires operator approval before launch/i)).toBeInTheDocument();
    expect(screen.getByRole("article").className).toContain("break-words");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("publishes the approved privacy-policy draft controls", () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 2, name: /retention schedule/i })).toBeInTheDocument();
    expect(screen.getByText(/up to seven years from the relevant tax year/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /privacy rights and deletion requests/i })).toBeInTheDocument();
    expect(screen.getByText(/complain to the Nigeria Data Protection Commission/i)).toBeInTheDocument();
  });

  it("publishes the approved terms dispute safeguards", () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 2, name: /governing law and disputes/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Arbitration and Mediation Act 2023/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/binding agreement/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Nothing in these terms excludes or limits liability/i)).toBeInTheDocument();
  });

  it.each([
    [Privacy, "Privacy policy | FileSmart", "/privacy"],
    [Terms, "Terms of use | FileSmart", "/terms"],
    [Disclaimer, "Disclaimer | FileSmart", "/disclaimer"],
  ] as const)("sets unique metadata for %s", (Component, title, path) => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );

    expect(document.title).toBe(title);
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute("content");
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://www.filesmartnaija.com${path}`,
    );
  });

  it("replaces landing footer placeholders with real legal routes", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /privacy notice/i })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: /terms and conditions/i })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: /disclaimer/i })).toHaveAttribute("href", "/disclaimer");
  });

  it.each([
    ["/privacy", /privacy policy/i],
    ["/terms", /terms of use/i],
    ["/disclaimer", /disclaimer/i],
  ] as const)("mounts %s in the public route table", async (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });
});
