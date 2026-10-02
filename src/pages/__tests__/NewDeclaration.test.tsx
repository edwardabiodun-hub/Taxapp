import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NewDeclaration from "@/pages/NewDeclaration";
import { savePreparation } from "@/lib/preparation-repository";
import { getDocumentMetadata } from "@/lib/preparation-documents";

vi.mock("@/lib/preparation-repository", () => ({
  savePreparation: vi.fn().mockResolvedValue(undefined),
}));

describe("NewDeclaration", () => {
  it("starts with a national jurisdiction selector and local-first preparation language", () => {
    render(
      <MemoryRouter>
        <NewDeclaration />
      </MemoryRouter>,
    );

    expect(screen.getByRole("searchbox", { name: /jurisdiction/i })).toBeInTheDocument();
    expect(screen.getAllByText(/not yet supported/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /save as draft/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit declaration/i })).not.toBeInTheDocument();
  });

  it("maps uploaded documents to serializable metadata without raw file bytes", () => {
    const file = new File(["private contents"], "payslip.pdf", {
      type: "application/pdf",
    });

    expect(
      getDocumentMetadata([
        { id: "doc-1", file, category: "payslip", preview: "blob:preview" },
      ]),
    ).toEqual([
      {
        id: "doc-1",
        name: "payslip.pdf",
        size: file.size,
        type: "application/pdf",
        category: "payslip",
      },
    ]);
  });

  it("saves ready-for-review directly as one intended status", async () => {
    const saveMock = vi.mocked(savePreparation);
    saveMock.mockClear();

    render(
      <MemoryRouter>
        <NewDeclaration />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/tax year/i), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: /Lagos/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.change(screen.getAllByPlaceholderText("0.00")[0], {
      target: { value: "1000000" },
    });

    for (let step = 0; step < 5; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    fireEvent.click(screen.getByRole("button", { name: /mark ready for review/i }));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready_for_review" }),
    );
  });
});
