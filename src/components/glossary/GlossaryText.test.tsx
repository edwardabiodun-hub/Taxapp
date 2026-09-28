import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { GlossaryText } from "./GlossaryText";

const entries = [
  {
    id: "vat",
    term: "VAT",
    aliases: ["Value Added Tax"],
    definition: "A consumption tax charged on taxable supplies.",
    statutoryReference: "Nigeria Tax Act, 2025, section 143",
    sourceUrl: "https://example.com/vat",
  },
];

describe("GlossaryText", () => {
  it("wraps text terms in accessible tooltip triggers", () => {
    render(
      <TooltipProvider>
        <GlossaryText entries={entries}>Value Added Tax applies here.</GlossaryText>
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: "Learn about VAT" })).toHaveTextContent("Value Added Tax");
  });

  it("supports click, Escape, and excludes links and code content", () => {
    render(
      <TooltipProvider>
        <GlossaryText entries={entries}>
          VAT applies. <a href="/vat">VAT link</a> <code>VAT</code>
        </GlossaryText>
      </TooltipProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Learn about VAT" });
    expect(screen.getByRole("link", { name: "VAT link" })).toBeInTheDocument();
    expect(screen.getByText("VAT", { selector: "code" })).toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getAllByRole("tooltip")[0]).toHaveTextContent("A consumption tax charged on taxable supplies.");
    expect(trigger).toHaveAttribute("aria-describedby");

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
