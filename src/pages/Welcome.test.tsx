import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Welcome from "./Welcome";

describe("Welcome", () => {
  it("links Sign In to the login route and Create account to the signup wizard", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute("href", "/onboarding");
  });

  it("shows the features list", () => {
    render(
      <MemoryRouter>
        <Welcome />
      </MemoryRouter>
    );

    expect(screen.getByText("Estimate your taxes")).toBeInTheDocument();
    expect(screen.getByText("Track your refund")).toBeInTheDocument();
  });
});
