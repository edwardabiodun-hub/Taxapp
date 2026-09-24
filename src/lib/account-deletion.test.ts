import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aparajita/capacitor-secure-storage", () => {
  const store: Record<string, string> = {};
  return {
    SecureStorage: {
      get: vi.fn(async (key: string) => store[key] ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
    },
  };
});

const deleteDeclarationFromServerMock = vi.fn(async () => {});
const pseudonymizeProfileOnServerMock = vi.fn(async () => {});
const signOutMock = vi.fn(async () => {});

vi.mock("./api", () => ({
  deleteDeclarationFromServer: (...args: unknown[]) => deleteDeclarationFromServerMock(...args),
  pseudonymizeProfileOnServer: () => pseudonymizeProfileOnServerMock(),
}));

vi.mock("./auth", () => ({
  signOut: () => signOutMock(),
}));

describe("requestAccountDeletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a declaration outside its retention hold, locally and on the server", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.declarations.put({
      id: "decl-old",
      taxYear: "2015", // long expired hold
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [],
      createdAt: "2015-01-01T00:00:00.000Z",
      updatedAt: "2015-01-01T00:00:00.000Z",
      pendingSync: 0,
    });

    const result = await requestAccountDeletion();

    expect(deleteDeclarationFromServerMock).toHaveBeenCalledWith("decl-old");
    expect(result.declarationsDeleted).toContain("decl-old");
    expect(await db.declarations.get("decl-old")).toBeUndefined();
  });

  it("deletes a declaration's documentFiles when the declaration itself is deleted outside its hold", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.declarations.put({
      id: "decl-old-with-docs",
      taxYear: "2015",
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [{ id: "doc-1", name: "payslip.pdf", size: 1024, type: "application/pdf" }],
      createdAt: "2015-01-01T00:00:00.000Z",
      updatedAt: "2015-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    await db.documentFiles.put({
      id: "doc-1",
      declarationId: "decl-old-with-docs",
      name: "payslip.pdf",
      size: 1024,
      type: "application/pdf",
      iv: new ArrayBuffer(12),
      ciphertext: new ArrayBuffer(32),
      createdAt: "2015-01-01T00:00:00.000Z",
    });

    await requestAccountDeletion();

    expect(await db.documentFiles.get("doc-1")).toBeUndefined();
  });

  it("does not delete a declaration still inside its retention hold, locally or on the server", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.declarations.put({
      id: "decl-held",
      taxYear: String(new Date().getFullYear()), // current year, well inside the six-year hold
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: 0,
    });

    const result = await requestAccountDeletion();

    expect(deleteDeclarationFromServerMock).not.toHaveBeenCalledWith("decl-held");
    expect(result.declarationsRetained).toContain("decl-held");
    expect(await db.declarations.get("decl-held")).toBeDefined();
  });

  it("preserves a retained declaration's documentFiles", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.declarations.put({
      id: "decl-held-with-docs",
      taxYear: String(new Date().getFullYear()),
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [{ id: "doc-held", name: "payslip.pdf", size: 1024, type: "application/pdf" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pendingSync: 0,
    });
    await db.documentFiles.put({
      id: "doc-held",
      declarationId: "decl-held-with-docs",
      name: "payslip.pdf",
      size: 1024,
      type: "application/pdf",
      iv: new ArrayBuffer(12),
      ciphertext: new ArrayBuffer(32),
      createdAt: new Date().toISOString(),
    });

    await requestAccountDeletion();

    expect(await db.documentFiles.get("doc-held")).toBeDefined();
  });

  it("never deletes locally when the server delete fails, to avoid drift a later sync could resurrect", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.declarations.put({
      id: "decl-fails",
      taxYear: "2015",
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [],
      createdAt: "2015-01-01T00:00:00.000Z",
      updatedAt: "2015-01-01T00:00:00.000Z",
      pendingSync: 0,
    });
    deleteDeclarationFromServerMock.mockRejectedValueOnce(new Error("network error"));

    const result = await requestAccountDeletion();

    expect(result.declarationsFailed).toContain("decl-fails");
    expect(result.declarationsDeleted).not.toContain("decl-fails");
    expect(await db.declarations.get("decl-fails")).toBeDefined();
  });

  it("pseudonymizes the local profile and signs out", async () => {
    const { db } = await import("./local-db");
    const { requestAccountDeletion } = await import("./account-deletion");

    await db.profiles.put({
      id: "user-1",
      name: "Amara Okafor",
      email: "amara@example.com",
      phone: "+2348123456789",
      taxId: "A012345678Z",
      country: "ng",
    });

    const result = await requestAccountDeletion();

    expect(result.profilePseudonymized).toBe(true);
    expect(pseudonymizeProfileOnServerMock).toHaveBeenCalled();
    const profile = await db.profiles.get("user-1");
    expect(profile?.name).not.toBe("Amara Okafor");
    expect(profile?.phone).toBe("");
    expect(profile?.taxId).toBe("A012345678Z"); // kept — needed to keep retained declarations attributable
    expect(profile?.pseudonymizedAt).toBeDefined();
    expect(signOutMock).toHaveBeenCalled();
  });
});
