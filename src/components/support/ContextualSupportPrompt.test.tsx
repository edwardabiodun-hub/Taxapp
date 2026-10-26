import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextualSupportPrompt } from "./ContextualSupportPrompt";

describe("ContextualSupportPrompt", () => {
  it("offers accessible open and dismiss actions", () => {
    const onOpenSupport = vi.fn();
    const onDismiss = vi.fn();
    render(<ContextualSupportPrompt onOpenSupport={onOpenSupport} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /open tax support/i }));
    fireEvent.click(screen.getByRole("button", { name: /dismiss tax support/i }));
    expect(onOpenSupport).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
