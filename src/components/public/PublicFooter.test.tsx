import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PublicFooter from "./PublicFooter";

describe("PublicFooter", () => {
  it("shows the FileSmart motto beneath its brand lockup", () => {
    render(<MemoryRouter><PublicFooter /></MemoryRouter>);

    expect(screen.getByText("Your connect for smarter, easier tax filing.")).toBeInTheDocument();
  });

  it("links to the official social profiles with accessible labels", () => {
    render(<MemoryRouter><PublicFooter /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "FileSmart on Facebook" })).toHaveAttribute("href", "https://www.facebook.com/filesmartnaija");
    expect(screen.getByRole("link", { name: "FileSmart on Instagram" })).toHaveAttribute("href", "https://www.instagram.com/filesmartnaija/");
    expect(screen.getByRole("link", { name: "FileSmart on LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/company/filesmart-bridge-iq-ltd/");
    expect(screen.getByRole("link", { name: "FileSmart on X" })).toHaveAttribute("href", "https://x.com/FileSmartNaija");
  });
});
