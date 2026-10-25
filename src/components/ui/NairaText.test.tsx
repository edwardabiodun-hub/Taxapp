import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NairaText } from "./NairaText";

describe("NairaText", () => {
  it("renders each naira sign with the dedicated high-clarity glyph", () => {
    render(<p><NairaText>Below ₦2 million, the price is ₦0.</NairaText></p>);

    const signs = screen.getAllByRole("img", { name: "Naira" });
    expect(signs).toHaveLength(2);
    for (const sign of signs) {
      expect(sign).toHaveClass("naira-symbol");
      expect(within(sign).getByTestId("naira-symbol-bars")).toBeInTheDocument();
    }
  });
});
