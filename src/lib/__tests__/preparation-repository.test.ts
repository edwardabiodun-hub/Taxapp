import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { createPreparationRecord, type PreparationRecord } from "@/domain/preparations";
import {
  appendSubmissionEvent,
  getPreparation,
  listPreparations,
  isValidPreparationStatusTransition,
  markPreparationSynced,
  migrateLegacyDeclarationsToPreparations,
  savePreparationFromSync,
  savePreparation,
} from "@/lib/preparation-repository";
import { db, type LocalDeclaration } from "@/lib/local-db";

const preparation = (
  id: string,
  updatedAt: string,
  status: "draft" | "ready_for_review" | "exported" = "draft",
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

  it("rejects status skips while preserving same-status updates", () => {
    expect(isValidPreparationStatusTransition(undefined, "draft")).toBe(true);
    expect(isValidPreparationStatusTransition(undefined, "ready_for_review")).toBe(false);
    expect(isValidPreparationStatusTransition(undefined, "exported")).toBe(false);
    expect(isValidPreparationStatusTransition(undefined, "user_submitted")).toBe(false);
    expect(isValidPreparationStatusTransition("draft", "draft")).toBe(true);
    expect(isValidPreparationStatusTransition("draft", "ready_for_review")).toBe(true);
    expect(isValidPreparationStatusTransition("draft", "exported")).toBe(false);
    expect(isValidPreparationStatusTransition("draft", "user_submitted")).toBe(false);
    expect(isValidPreparationStatusTransition("ready_for_review", "authority_confirmed")).toBe(false);
    expect(isValidPreparationStatusTransition("authority_confirmed", "authority_confirmed")).toBe(true);
  });

  it("does not acknowledge a same-timestamp edit made while a push is in flight", async () => {
    await db.delete();
    await db.open();

    const pushed = preparation("prep-ack", "2026-02-01T00:00:00.000Z");
    await savePreparation(pushed);
    const edited = { ...pushed, formData: { country: "ng", annualSalary: "new" } };
    await savePreparation(edited);

    await expect(
      markPreparationSynced(pushed, "2026-02-02T00:00:00.000Z"),
    ).resolves.toBe(false);
    await expect(db.preparations.get(pushed.id)).resolves.toMatchObject({
      pendingSync: true,
      formData: { country: "ng", annualSalary: "new" },
    });
  });

  it("does not let stale sync data overwrite a pending local preparation", async () => {
    await db.delete();
    await db.open();

    const local = preparation("prep-stale", "2026-02-01T00:00:00.000Z");
    await savePreparation(local);

    await savePreparationFromSync(
      {
        ...local,
        status: "ready_for_review",
        formData: { country: "ng", annualSalary: "stale" },
        updatedAt: "2026-01-01T00:00:00.000Z",
      } as PreparationRecord,
      "2026-02-02T00:00:00.000Z",
    );

    const stored = await db.preparations.get(local.id);
    expect(stored).toMatchObject({
      formData: { country: "ng" },
      pendingSync: true,
      updatedAt: "2026-02-01T00:00:00.000Z",
    });
  });

  it("migrates local legacy declarations even when the server does not return them", async () => {
    await db.delete();
    await db.open();

    const legacy: LocalDeclaration = {
      id: "local-only",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "submitted",
      formData: { annualSalary: "1000000" },
      documents: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
      pendingSync: true,
    };
    await db.declarations.put(legacy);

    await migrateLegacyDeclarationsToPreparations([legacy]);

    await expect(getPreparation(legacy.id)).resolves.toMatchObject({
      status: "ready_for_review",
      formData: { annualSalary: "1000000", country: "ng" },
    });
    await expect(db.preparations.get(legacy.id)).resolves.toMatchObject({
      pendingSync: true,
    });
  });

  it("preserves a newer local preparation instead of downgrading it during migration", async () => {
    await db.delete();
    await db.open();

    const local = preparation("local-newer", "2026-02-01T00:00:00.000Z");
    await savePreparation(local);
    const legacy: LocalDeclaration = {
      id: local.id,
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "submitted",
      formData: { annualSalary: "old" },
      documents: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      pendingSync: false,
      syncedAt: "2026-01-01T00:00:00.000Z",
    };

    await migrateLegacyDeclarationsToPreparations([legacy]);

    await expect(db.preparations.get(local.id)).resolves.toMatchObject({
      pendingSync: true,
      updatedAt: local.updatedAt,
      formData: { country: "ng" },
    });
  });

  it("does not downgrade an exported preparation when legacy data is newer", async () => {
    await db.delete();
    await db.open();

    const draft = preparation("exported-local", "2026-01-01T00:00:00.000Z");
    await savePreparation(draft);
    const ready = { ...draft, status: "ready_for_review" as const, updatedAt: "2026-01-02T00:00:00.000Z" };
    await savePreparation(ready);
    const exported = { ...ready, status: "exported" as const, updatedAt: "2026-01-03T00:00:00.000Z" };
    await savePreparation(exported);

    await migrateLegacyDeclarationsToPreparations([{
      id: exported.id,
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "submitted",
      formData: { annualSalary: "legacy" },
      documents: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-04T00:00:00.000Z",
      pendingSync: false,
    }]);

    await expect(db.preparations.get(exported.id)).resolves.toMatchObject({
      status: "exported",
      formData: exported.formData,
      pendingSync: true,
    });
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
