import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PublicFooter from "./PublicFooter";

describe("PublicFooter", () => {
  it("shows the FileSmart motto beneath its brand lockup", () => {
    render(<MemoryRouter><PublicFooter /></MemoryRouter>);

    expect(screen.getByText("Your connect for smarter, easier tax filing.")).toBeInTheDocument();
  });
});
