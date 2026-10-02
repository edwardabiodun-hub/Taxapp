import { lazy } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import RouteBoundary from "../RouteBoundary";

afterEach(() => vi.restoreAllMocks());

describe("RouteBoundary", () => {
  it("announces loading until the requested page is available", async () => {
    let resolvePage: (value: { default: () => JSX.Element }) => void;
    const Page = lazy(() => new Promise<{ default: () => JSX.Element }>((resolve) => {
      resolvePage = resolve;
    }));
    render(<MemoryRouter><RouteBoundary><Page /></RouteBoundary></MemoryRouter>);
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
    resolvePage!({ default: () => <h1>Requested page</h1> });
    expect(await screen.findByRole("heading", { name: "Requested page" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("contains failed imports, hides internal errors, and allows navigation away", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const BrokenPage = lazy(() => Promise.reject(new Error("private internal URL")));
    render(
      <MemoryRouter>
        <Link to="/working">Go to working page</Link>
        <RouteBoundary>
          <Routes>
            <Route path="/" element={<BrokenPage />} />
            <Route path="/working" element={<h1>Working page</h1>} />
          </Routes>
        </RouteBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("This page could not be loaded");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeEnabled();
    expect(screen.queryByText(/private internal URL/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Go to working page" }));
    expect(await screen.findByRole("heading", { name: "Working page" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
