import { describe, expect, it } from "vitest";
import { migrateLegacyDeclaration } from "@/lib/preparation-repository";
import type { LocalDeclaration } from "@/lib/local-db";

const legacyDeclaration = (overrides: Partial<LocalDeclaration> = {}): LocalDeclaration => ({
  id: "decl-1",
  taxYear: "2025",
  country: "ng",
  type: "Income Tax",
  status: "submitted",
  formData: {},
  documents: [],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  pendingSync: false,
  ...overrides,
});

describe("legacy declaration migration", () => {
  it("does not treat the legacy submitted flag as authority confirmation", () => {
    const migrated = migrateLegacyDeclaration(legacyDeclaration());

    expect(migrated.status).toBe("ready_for_review");
    expect(migrated.status).not.toBe("authority_confirmed");
  });

  it("does not promote legacy authority fields without local authority state", () => {
    const migrated = migrateLegacyDeclaration(
      legacyDeclaration({
        authorityReference: "NRS-2025-0001",
        authorityConfirmedAt: "2026-01-02T00:00:00.000Z",
      }),
    );

    expect(migrated.status).toBe("ready_for_review");
    expect(migrated.authorityConfirmation).toBeUndefined();
  });

  it("does not synthesize an authority confirmation timestamp", () => {
    const migrated = migrateLegacyDeclaration(
      legacyDeclaration({
        authorityReference: "NRS-2025-0001",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    );

    expect(migrated.status).toBe("ready_for_review");
    expect(migrated.authorityConfirmation).toBeUndefined();
  });

  it("requires an explicit authority reference as well as a timestamp", () => {
    const migrated = migrateLegacyDeclaration(
      legacyDeclaration({
        authorityConfirmedAt: "2026-01-02T00:00:00.000Z",
      }),
    );

    expect(migrated.status).toBe("ready_for_review");
    expect(migrated.authorityConfirmation).toBeUndefined();
  });

  it("does not guess a state when migrating a country-only Nigerian record", () => {
    const migrated = migrateLegacyDeclaration(legacyDeclaration());

    expect(migrated.jurisdictionCode).toBe("NG");
    expect(migrated.formData).toMatchObject({ country: "ng" });
  });
});
