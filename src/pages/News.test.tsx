import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import News from "./News";
import NewsArticle from "./NewsArticle";

describe("news pages", () => {
  it("lists the published calculator launch", () => {
    render(<MemoryRouter><News /></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: /product updates and tax preparation news/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read fileSmart launches a Nigeria Tax Calculator/i })).toHaveAttribute("href", "/news/filesmart-nigeria-tax-calculator-launch");
  });

  it("renders an AEO-friendly launch article with direct answers and a calculator CTA", () => {
    render(<MemoryRouter initialEntries={["/news/filesmart-nigeria-tax-calculator-launch"]}><Routes><Route path="/news/:slug" element={<NewsArticle />} /></Routes></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: /FileSmart Launches a Nigeria Tax Calculator for 2026/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "What is the Nigeria Tax Calculator?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try the Nigeria Tax Calculator" })).toHaveAttribute("href", "/calculator");
    expect(screen.getByText(/Does the calculator file my tax return\?/i)).toBeInTheDocument();
  });
});
