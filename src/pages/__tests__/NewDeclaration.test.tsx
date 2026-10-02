import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NewDeclaration from "@/pages/NewDeclaration";
import { savePreparation } from "@/lib/preparation-repository";
import { getDocumentMetadata } from "@/lib/preparation-documents";
import { listReceiptRecords } from "@/lib/receipt-repository";
import type { ExportPackage } from "@/domain/exports";

const { exportPreparationMock } = vi.hoisted(() => ({
  exportPreparationMock: vi.fn(),
}));

vi.mock("@/lib/preparation-repository", () => ({
  getPreparation: vi.fn().mockResolvedValue(undefined),
  savePreparation: vi.fn().mockResolvedValue(undefined),
  appendSubmissionEvent: vi.fn().mockResolvedValue(undefined),
  savePreparationAndAppendSubmissionEvent: vi.fn().mockResolvedValue(undefined),
  savePreparationAndAppendSubmissionEventWithExportPackages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/receipt-repository", () => ({
  listReceiptRecords: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/submission-service", () => ({
  submissionService: {
    export: exportPreparationMock,
  },
}));

const generatedExportPackage: ExportPackage = {
  id: "export-prep-1-20261002",
  preparationId: "prep-1",
  schemaVersion: "1.0.0",
  status: "exported",
  generatedAt: "2026-10-02T12:34:56.000Z",
  metadata: {
    schemaVersion: "1.0.0",
    preparationId: "prep-1",
    jurisdiction: "Lagos",
    jurisdictionCode: "NG-LA",
    taxYear: "2026",
    registryVersion: "2026.1",
    ruleProfileId: "ng-pit-baseline",
    ruleProfileVersion: "",
    calculationLabel: "Generic Nigerian PIT estimate",
    readiness: "Not yet supported",
    source: "",
    sourceVerifiedAt: "",
    deadlineSource: "",
    deadlineVerifiedAt: "",
    generatedAt: "2026-10-02T12:34:56.000Z",
    notSubmitted: true,
  },
  artifacts: ["pdf", "csv", "xlsx"].map((format) => ({
    format: format as "pdf" | "csv" | "xlsx",
    fileName: `taxease-prep-1-2026.${format}`,
    mimeType: "application/octet-stream",
    artifactRef: `exports/prep-1/${format}/20261002`,
    data: new Blob([format]),
  })),
};

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

  it("generates and exposes universal downloads from the review step", async () => {
    const saveMock = vi.mocked(savePreparation);
    const listMock = vi.mocked(listReceiptRecords);
    saveMock.mockClear();
    listMock.mockResolvedValue([]);
    saveMock.mockResolvedValue(undefined);
    exportPreparationMock.mockResolvedValue(generatedExportPackage);

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
    await waitFor(() => expect(screen.getByRole("button", { name: /generate universal package/i })).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: /generate universal package/i }));

    await waitFor(() => expect(exportPreparationMock).toHaveBeenCalledWith(expect.any(String)));
    expect(await screen.findByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeEnabled();
    expect(screen.getAllByText(/exported.*downloads ready/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: /exported preparation/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save as draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark ready for review/i })).not.toBeInTheDocument();
  });
});
