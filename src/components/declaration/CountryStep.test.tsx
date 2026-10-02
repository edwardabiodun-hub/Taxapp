import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { defaultNigeriaForm } from "@/types/declaration";
import CountryStep from "./CountryStep";

describe("CountryStep", () => {
  it("shows only Nigeria during the Nigeria-first launch phase", () => {
    render(<CountryStep form={defaultNigeriaForm} update={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Nigeria/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Kenya/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ghana/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /South Africa/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tanzania/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Uganda/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rwanda/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ethiopia/ })).not.toBeInTheDocument();
  });
});
