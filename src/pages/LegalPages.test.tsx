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

const legalPages = [
  { name: "privacy", heading: /privacy policy/i, Component: Privacy },
  { name: "terms", heading: /terms of use/i, Component: Terms },
  { name: "disclaimer", heading: /disclaimer/i, Component: Disclaimer },
] as const;

describe("public legal pages", () => {
  it.each(legalPages)("renders the $name page with approval-safe placeholders", ({ Component, heading }) => {
    render(
      <MemoryRouter>
        <Component />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByText(/operator identity pending approval/i)).toBeInTheDocument();
    expect(screen.getAllByText(/privacy contact pending approval/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/requires operator approval before launch/i)).toBeInTheDocument();
    expect(document.querySelectorAll("h1")).toHaveLength(1);
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
  ] as const)("mounts %s in the public route table", (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });
});
