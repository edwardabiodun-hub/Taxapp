import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { createPreparationRecord, type PreparationRecord } from "@/domain/preparations";
import {
  appendSubmissionEvent,
  getPreparation,
  listPreparations,
  savePreparation,
} from "@/lib/preparation-repository";
import { db } from "@/lib/local-db";

const preparation = (
  id: string,
  updatedAt: string,
  status: "draft" | "ready_for_review" = "draft",
) =>
  createPreparationRecord(
    {
      id,
      jurisdictionCode: "",
      taxYear: "2025",
      ruleProfileVersion: "",
      status,
      formData: { country: "ng" },
      confirmedReceiptIds: [],
      confirmedReceiptInputs: {},
      createdAt: updatedAt,
      updatedAt,
    },
    getJurisdictionCapability("NG-FCT"),
  );

describe("preparation repository", () => {
  it("saves and retrieves only the requested preparation", async () => {
    await db.delete();
    await db.open();

    const first = preparation("prep-1", "2026-01-01T00:00:00.000Z");
    const second = preparation("prep-2", "2026-01-02T00:00:00.000Z");
    await savePreparation(first);
    await savePreparation(second);

    await expect(getPreparation(first.id)).resolves.toEqual(first);
    await expect(getPreparation("missing")).resolves.toBeUndefined();
  });

  it("lists preparations by updatedAt descending and preserves a newer timestamp", async () => {
    await db.delete();
    await db.open();

    await savePreparation(preparation("older", "2026-01-01T00:00:00.000Z"));
    await savePreparation(preparation("newer", "2026-01-02T00:00:00.000Z"));
    const saved = await getPreparation("newer");
    await savePreparation({
      ...saved!,
      status: "ready_for_review",
      updatedAt: "2025-01-01T00:00:00.000Z",
    } as PreparationRecord);

    await expect(listPreparations()).resolves.toEqual([
      expect.objectContaining({ id: "newer", updatedAt: "2026-01-02T00:00:00.000Z" }),
      expect.objectContaining({ id: "older" }),
    ]);
  });

  it("rejects a direct draft-to-authority-confirmed transition", async () => {
    await db.delete();
    await db.open();

    const draft = preparation("prep-transition", "2026-01-01T00:00:00.000Z");
    await savePreparation(draft);

    await expect(
      savePreparation({
        ...draft,
        status: "authority_confirmed",
        authorityConfirmation: {
          authorityReference: "NRS-1",
          confirmedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
    ).rejects.toThrow(/invalid preparation status transition/i);
  });

  it("appends immutable submission events and requires authority references", async () => {
    await db.delete();
    await db.open();

    const event = {
      id: "event-1",
      preparationId: "prep-1",
      type: "created" as const,
      actor: "user" as const,
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    await appendSubmissionEvent(event);

    await expect(appendSubmissionEvent({ ...event, actor: "system" })).rejects.toThrow(
      /immutable/i,
    );
    await expect(
      appendSubmissionEvent({
        id: "event-2",
        preparationId: "prep-1",
        type: "authority_confirmed",
        actor: "authority",
        timestamp: "2026-01-02T00:00:00.000Z",
        authorityReference: "",
      } as never),
    ).rejects.toThrow(/authority reference/i);
  });
});
