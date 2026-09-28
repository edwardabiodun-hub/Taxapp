import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("toggles visibility and announces the current state", () => {
    render(<PasswordInput aria-label="Password" />);

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("aria-pressed", "false");
  });

  it("preserves input props and reserves space for the toggle", () => {
    render(
      <PasswordInput
        id="account-password"
        aria-label="Password"
        name="password"
        autoComplete="current-password"
        className="border-destructive"
        disabled
      />,
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("id", "account-password");
    expect(input).toHaveAttribute("name", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toBeDisabled();
    expect(input.className).toContain("pr-11");
    expect(input.className).toContain("border-destructive");
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });
});
