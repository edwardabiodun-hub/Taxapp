import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { PreparationRecord } from "@/domain/preparations";
import type { SubmissionEvent } from "@/domain/submissions";
import {
  SubmissionService,
  type SubmissionRepository,
} from "@/lib/submission-service";

const capability = getJurisdictionCapability("NG-LA");

const preparation = (): PreparationRecord => ({
  id: "prep-1",
  jurisdictionCode: capability.jurisdictionCode,
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
    assumptions: ["No state-specific rules are claimed."],
    missingInputWarnings: [],
  },
  formData: { annualSalary: "1000000" },
  confirmedReceiptIds: [],
  confirmedReceiptInputs: {},
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  status: "ready_for_review",
});

function createMemoryService(initial = preparation()) {
  let current = initial;
  const events: SubmissionEvent[] = [];
  const exportRecords: unknown[] = [];
  let failAtomicTransition = false;
  const repository: SubmissionRepository = {
    getPreparation: async () => current,
    savePreparation: async (next) => {
      current = next;
    },
    appendSubmissionEvent: async (event) => {
      events.push(event);
    },
    savePreparationAndAppendSubmissionEvent: async (next, event) => {
      if (failAtomicTransition) {
        throw new Error("atomic transition failed");
      }
      current = next;
      events.push(event);
    },
    savePreparationAndAppendSubmissionEventWithExportPackages: async (next, event, records) => {
      if (failAtomicTransition) {
        throw new Error("atomic export transition failed");
      }
      current = next;
      events.push(event);
      exportRecords.push(...records);
    },
  };

  return {
    service: new SubmissionService({
      repository,
      now: () => "2026-10-02T12:00:00.000Z",
    }),
    read: () => current,
    events,
    exportRecords,
    failAtomicTransition: () => {
      failAtomicTransition = true;
    },
  };
}

describe("SubmissionService", () => {
  it("allows export without authority confirmation", async () => {
    const memory = createMemoryService();

    const result = await memory.service.export("prep-1");

    expect(result.metadata.notSubmitted).toBe(true);
    expect(memory.read()).toMatchObject({ status: "exported" });
    expect(memory.events).toContainEqual(
      expect.objectContaining({ type: "exported", actor: "system" }),
    );
    expect(memory.exportRecords).toHaveLength(3);
  });

  it("rejects authority confirmation without an official reference", async () => {
    const memory = createMemoryService({ ...preparation(), status: "user_submitted" } as PreparationRecord);

    await expect(memory.service.confirmAuthority("prep-1", "")).rejects.toThrow(
      /reference/i,
    );
    expect(memory.read().status).toBe("user_submitted");
  });

  it("requires explicit user evidence before moving an export to user submitted", async () => {
    const memory = createMemoryService({ ...preparation(), status: "exported" } as PreparationRecord);

    await expect(
      memory.service.markUserSubmitted("prep-1", { source: "" }),
    ).rejects.toThrow(/evidence/i);

    await memory.service.markUserSubmitted("prep-1", {
      source: "manual-handoff",
      reference: "user-confirmed-2026-10-02",
    });

    expect(memory.read()).toMatchObject({ status: "user_submitted" });
    expect(memory.events).toContainEqual(
      expect.objectContaining({
        type: "user_submitted",
        actor: "user",
        userEvidence: {
          source: "manual-handoff",
          reference: "user-confirmed-2026-10-02",
          submittedAt: "2026-10-02T12:00:00.000Z",
        },
      }),
    );
  });

  it("rejects arbitrary or future submittedAt evidence without changing status", async () => {
    const memory = createMemoryService({ ...preparation(), status: "exported" } as PreparationRecord);

    await expect(
      memory.service.markUserSubmitted("prep-1", {
        source: "manual-handoff",
        reference: "user-confirmed-2026-10-02",
        submittedAt: "not-a-timestamp",
      }),
    ).rejects.toThrow(/timestamp/i);
    await expect(
      memory.service.markUserSubmitted("prep-1", {
        source: "manual-handoff",
        reference: "user-confirmed-2026-10-02",
        submittedAt: "2026-10-03T00:00:00.000Z",
      }),
    ).rejects.toThrow(/future/i);

    expect(memory.read().status).toBe("exported");
    expect(memory.events).toHaveLength(0);
  });

  it("does not leave user-submitted status when the atomic event transition fails", async () => {
    const memory = createMemoryService({ ...preparation(), status: "exported" } as PreparationRecord);
    memory.failAtomicTransition();

    await expect(
      memory.service.markUserSubmitted("prep-1", { source: "manual-handoff" }),
    ).rejects.toThrow(/atomic/i);

    expect(memory.read().status).toBe("exported");
    expect(memory.events).toHaveLength(0);
  });

  it("does not leave export metadata when the atomic export transition fails", async () => {
    const memory = createMemoryService();
    memory.failAtomicTransition();

    await expect(memory.service.export("prep-1")).rejects.toThrow(/atomic export/i);

    expect(memory.read().status).toBe("ready_for_review");
    expect(memory.events).toHaveLength(0);
    expect(memory.exportRecords).toHaveLength(0);
  });

  it("rejects an invalid service clock for authority confirmation", async () => {
    const memory = createMemoryService({ ...preparation(), status: "user_submitted" } as PreparationRecord);
    const invalidClock = new SubmissionService({
      repository: {
        getPreparation: async () => memory.read(),
        savePreparation: async () => undefined,
        appendSubmissionEvent: async () => undefined,
        savePreparationAndAppendSubmissionEvent: async () => undefined,
        savePreparationAndAppendSubmissionEventWithExportPackages: async () => undefined,
      },
      now: () => "not-a-timestamp",
    });

    await expect(invalidClock.confirmAuthority("prep-1", "NRS-2026-0001")).rejects.toThrow(/timestamp/i);
  });

  it("requires user submission before authority confirmation and preserves the official reference", async () => {
    const memory = createMemoryService({ ...preparation(), status: "exported" } as PreparationRecord);

    await expect(
      memory.service.confirmAuthority("prep-1", "NRS-2026-0001"),
    ).rejects.toThrow(/transition|user submission/i);

    await memory.service.markUserSubmitted("prep-1", {
      source: "authority-portal",
      reference: "portal-receipt-1",
    });
    await memory.service.confirmAuthority("prep-1", "NRS-2026-0001");

    expect(memory.read()).toMatchObject({
      status: "authority_confirmed",
      authorityConfirmation: {
        authorityReference: "NRS-2026-0001",
        confirmedAt: "2026-10-02T12:00:00.000Z",
      },
    });
  });

  it("prevents re-exporting an authority-confirmed preparation", async () => {
    const memory = createMemoryService({
      ...preparation(),
      status: "authority_confirmed",
      authorityConfirmation: {
        authorityReference: "NRS-2026-0001",
        confirmedAt: "2026-10-02T12:00:00.000Z",
      },
    } as PreparationRecord);

    await expect(memory.service.export("prep-1")).rejects.toThrow(/authority-confirmed|export/i);
    expect(memory.read().status).toBe("authority_confirmed");
    expect(memory.events).toHaveLength(0);
  });
});
