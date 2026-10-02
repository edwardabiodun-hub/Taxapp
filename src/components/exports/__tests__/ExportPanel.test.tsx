import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExportPanel, { downloadExportArtifact } from "@/components/exports/ExportPanel";
import type { ExportPackage } from "@/domain/exports";

const exportPackage = {
  id: "export-1",
  preparationId: "prep-1",
  schemaVersion: "1.0.0",
  status: "exported" as const,
  generatedAt: "2026-10-02T00:00:00.000Z",
  metadata: {
    schemaVersion: "1.0.0",
    preparationId: "prep-1",
    jurisdiction: "Lagos",
    jurisdictionCode: "NG-LA",
    taxYear: "2026",
    registryVersion: "2026.1",
    ruleProfileId: "ng-pit-baseline",
    ruleProfileVersion: "",
    calculationLabel: "Generic Nigerian PIT estimate" as const,
    readiness: "Not yet supported" as const,
    source: "",
    sourceVerifiedAt: "",
    deadlineSource: "",
    deadlineVerifiedAt: "",
    generatedAt: "2026-10-02T00:00:00.000Z",
    notSubmitted: true as const,
  },
  artifacts: ["pdf", "csv", "xlsx"].map((format) => ({
    format: format as "pdf" | "csv" | "xlsx",
    fileName: `tax-export.${format}`,
    mimeType: "application/octet-stream",
    artifactRef: `exports/prep-1/${format}`,
    data: new Blob([format]),
  })),
} satisfies ExportPackage;

describe("ExportPanel", () => {
  it("renders download actions and never presents export as submitted", () => {
    const onDownload = vi.fn();
    render(<ExportPanel exportPackage={exportPackage} onDownload={onDownload} />);

    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /download xlsx/i })).toBeEnabled();
    expect(screen.queryByText(/authority confirmed|user submitted/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ format: "csv" }));
  });

  it("revokes object URLs after the browser has had a chance to consume the download link", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:download");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    downloadExportArtifact(exportPackage.artifacts[0]);

    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:download");

    click.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    vi.useRealTimers();
  });
});
