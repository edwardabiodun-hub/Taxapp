import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NewDeclaration from "@/pages/NewDeclaration";
import { savePreparation } from "@/lib/preparation-repository";
import { getDocumentMetadata } from "@/lib/preparation-documents";
import { listReceiptRecords } from "@/lib/receipt-repository";

vi.mock("@/lib/preparation-repository", () => ({
  savePreparation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/receipt-repository", () => ({
  listReceiptRecords: vi.fn().mockResolvedValue([]),
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

  it("clears saving state and reports receipt storage failures", async () => {
    const listMock = vi.mocked(listReceiptRecords);
    listMock.mockRejectedValueOnce(new Error("Receipt storage unavailable."));

    render(
      <MemoryRouter>
        <NewDeclaration />
      </MemoryRouter>,
    );

    const saveButton = screen.getByRole("button", { name: /save as draft/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/receipt attachments could not be loaded/i));
    expect(saveButton).not.toBeDisabled();
  });

  it("saves a fresh ready-for-review action through draft first", async () => {
    const saveMock = vi.mocked(savePreparation);
    saveMock.mockClear();
    const statuses: string[] = [];
    saveMock.mockImplementation(async (record) => {
      statuses.push(record.status);
      if (statuses.length === 1 && record.status !== "draft") {
        throw new Error("Invalid preparation status transition from new to ready_for_review.");
      }
    });

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

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(2));
    expect(statuses).toEqual(["draft", "ready_for_review"]);
    expect(saveMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "ready_for_review" }),
    );
  });
});
