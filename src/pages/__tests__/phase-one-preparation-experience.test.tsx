import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "@/pages/Dashboard";
import Submissions from "@/pages/Submissions";
import type { PreparationRecord } from "@/domain/preparations";
import type { SubmissionRecord } from "@/lib/submission-records";

const preparation = {
  id: "prep-lagos-synthetic",
  jurisdictionCode: "NG-LA",
  taxYear: "2026",
  ruleProfileVersion: "",
  calculationLabel: "Generic Nigerian PIT estimate",
  filingReadiness: "Not yet supported",
  calculationProvenance: {
    label: "Generic Nigerian PIT estimate",
    ruleProfileId: "ng-pit-baseline",
    ruleProfileVersion: "",
    source: "",
    effectiveTaxYears: [],
    effectiveFrom: "",
    verifiedAt: "",
    confidence: null,
    assumptions: [],
    missingInputWarnings: [],
  },
  status: "exported",
  formData: {},
  confirmedReceiptIds: [],
  confirmedReceiptInputs: {},
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-02T12:00:00.000Z",
  lastExportedAt: "2026-10-02T12:00:00.000Z",
} satisfies PreparationRecord;

const record: SubmissionRecord = {
  id: preparation.id,
  kind: "preparation",
  preparation,
};

vi.mock("@/hooks/use-local-data", () => ({
  useProfile: () => ({ name: "Synthetic user" }),
  useDeclarations: () => [],
  usePreparations: () => [preparation],
  useSubmissionRecords: () => [record],
}));

vi.mock("@/hooks/use-sync", () => ({
  useSync: () => ({ status: "idle", runSync: vi.fn() }),
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [
    { format: "pdf", preparationId: preparation.id },
    { format: "csv", preparationId: preparation.id },
    { format: "xlsx", preparationId: preparation.id },
  ],
}));

describe("phase one preparation experience", () => {
  it("keeps the dashboard centered on preparation status and free tools", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/preparations/i)).toBeInTheDocument();
    expect(screen.getByText(/generic Nigerian PIT estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/not yet supported/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tax estimator/i })).toBeInTheDocument();
    expect(screen.queryByText(/file your taxes/i)).not.toBeInTheDocument();
  });

  it("shows jurisdiction, calculation, readiness, and export formats in history", () => {
    render(
      <MemoryRouter>
        <Submissions />
      </MemoryRouter>,
    );

    expect(screen.getByText(/jurisdiction: Lagos/i)).toBeInTheDocument();
    expect(screen.getByText(/calculation: Generic Nigerian PIT estimate/i)).toBeInTheDocument();
    expect(screen.getByText(/readiness: Not yet supported/i)).toBeInTheDocument();
    expect(screen.getByText(/export package: PDF, CSV, XLSX/i)).toBeInTheDocument();
    expect(screen.getByText("Exported")).toBeInTheDocument();
  });
});
