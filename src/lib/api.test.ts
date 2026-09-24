import { describe, it, expect, vi, beforeEach } from "vitest";

interface FakeQueryBuilder extends PromiseLike<{ data: unknown; error: unknown }> {
  select: () => FakeQueryBuilder;
  eq: () => FakeQueryBuilder;
  delete: () => FakeQueryBuilder;
  update: () => FakeQueryBuilder;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  returns: () => Promise<{ data: unknown; error: unknown }>;
  upsert: () => Promise<{ error: unknown }>;
}

function makeQueryBuilder(result: { data: unknown; error: unknown }): FakeQueryBuilder {
  const builder: FakeQueryBuilder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    returns: vi.fn(async () => result),
    upsert: vi.fn(async () => ({ error: result.error ?? null })),
    // Real Supabase query builders are themselves thenable, so a bare chain
    // like .delete().eq().eq() can be awaited directly without a named
    // terminal method — mirrored here so that pattern works in tests too.
    then: (onfulfilled, onrejected) => Promise.resolve(result).then(onfulfilled, onrejected),
  };
  return builder;
}

const fromMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("./supabase-client", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => getUserMock(...args) },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-uuid-1", email: "amara@example.com" } } });
  });

  describe("fetchProfileFromServer", () => {
    it("maps a profile row to LocalProfile shape, pulling email from the auth user", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: {
            id: "user-uuid-1",
            name: "Amara Okafor",
            phone: "+2348123456789",
            tax_id: "A012345678Z",
            country: "ng",
            date_of_birth: "1990-05-15",
            country_of_birth: "ng",
            gender: "Female",
            nationality: "Nigerian",
            consent_accepted_at: "2026-01-01T00:00:00.000Z",
          },
          error: null,
        })
      );

      const { fetchProfileFromServer } = await import("./api");
      const profile = await fetchProfileFromServer();

      expect(profile).toEqual({
        id: "user-uuid-1",
        name: "Amara Okafor",
        email: "amara@example.com",
        phone: "+2348123456789",
        taxId: "A012345678Z",
        country: "ng",
        dateOfBirth: "1990-05-15",
        countryOfBirth: "ng",
        gender: "Female",
        nationality: "Nigerian",
        consentAcceptedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("returns null when no profile row exists yet (first sync, before any push)", async () => {
      fromMock.mockReturnValue(makeQueryBuilder({ data: null, error: null }));

      const { fetchProfileFromServer } = await import("./api");
      const profile = await fetchProfileFromServer();

      expect(profile).toBeNull();
    });

    it("converts null optional fields to undefined, not null", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: {
            id: "user-uuid-1",
            name: "Amara Okafor",
            phone: "+2348123456789",
            tax_id: "A012345678Z",
            country: "ng",
            date_of_birth: null,
            country_of_birth: null,
            gender: null,
            nationality: null,
            consent_accepted_at: null,
          },
          error: null,
        })
      );

      const { fetchProfileFromServer } = await import("./api");
      const profile = await fetchProfileFromServer();

      expect(profile?.dateOfBirth).toBeUndefined();
      expect(profile?.gender).toBeUndefined();
    });
  });

  describe("fetchDeclarationsFromServer", () => {
    it("maps declaration rows from snake_case to camelCase and marks them synced", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "decl-1",
              tax_year: "2025",
              country: "ng",
              type: "Income Tax",
              status: "submitted",
              form_data: { annualSalary: "900000" },
              documents: [],
              amount: "NGN 45,200",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchDeclarationsFromServer } = await import("./api");
      const declarations = await fetchDeclarationsFromServer();

      expect(declarations).toHaveLength(1);
      expect(declarations[0]).toMatchObject({
        id: "decl-1",
        taxYear: "2025",
        formData: { annualSalary: "900000" },
        amount: "NGN 45,200",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        pendingSync: 0,
      });
    });

    it("maps a present state, and leaves it undefined when absent (e.g. a declaration created before this feature existed)", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "decl-1", tax_year: "2025", country: "ng", type: "Income Tax", status: "submitted",
              form_data: {}, documents: [], amount: null, state: "lagos",
              created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-02T00:00:00.000Z",
            },
            {
              id: "decl-2", tax_year: "2024", country: "ng", type: "Income Tax", status: "approved",
              form_data: {}, documents: [], amount: null, state: null,
              created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-02T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchDeclarationsFromServer } = await import("./api");
      const declarations = await fetchDeclarationsFromServer();

      expect(declarations[0].state).toBe("lagos");
      expect(declarations[1].state).toBeUndefined();
    });
  });

  describe("pushDeclarationsToServer", () => {
    it("upserts declarations scoped to the current user, mapped to snake_case", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pushDeclarationsToServer } = await import("./api");
      await pushDeclarationsToServer([
        {
          id: "decl-1",
          taxYear: "2025",
          country: "ng",
          type: "Income Tax",
          status: "submitted",
          formData: { annualSalary: "900000" },
          documents: [],
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          pendingSync: 1,
        },
      ]);

      expect(builder.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "decl-1",
          user_id: "user-uuid-1",
          tax_year: "2025",
          form_data: { annualSalary: "900000" },
        }),
      ]);
      // updated_at must NOT be sent — the DB trigger owns that column, and
      // it's a different clock than local updatedAt (see api.ts comment).
      expect(builder.upsert.mock.calls[0][0][0]).not.toHaveProperty("updated_at");
    });

    it("includes state in the upserted row when present", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pushDeclarationsToServer } = await import("./api");
      await pushDeclarationsToServer([
        {
          id: "decl-1",
          taxYear: "2025",
          country: "ng",
          type: "Income Tax",
          status: "submitted",
          formData: {},
          documents: [],
          state: "lagos",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          pendingSync: 1,
        },
      ]);

      expect(builder.upsert).toHaveBeenCalledWith([
        expect.objectContaining({ id: "decl-1", state: "lagos" }),
      ]);
    });
  });

  describe("fetchActivitiesFromServer", () => {
    it("maps activity rows to LocalActivity shape with pendingSync 0", async () => {
      fromMock.mockReturnValue(
        makeQueryBuilder({
          data: [
            {
              id: "act-1",
              declaration_id: "decl-1",
              type: "document_upload",
              title: "1 document uploaded",
              description: "payslip.pdf",
              meta: null,
              timestamp: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        })
      );

      const { fetchActivitiesFromServer } = await import("./api");
      const activities = await fetchActivitiesFromServer();

      expect(activities).toEqual([
        {
          id: "act-1",
          declarationId: "decl-1",
          type: "document_upload",
          title: "1 document uploaded",
          description: "payslip.pdf",
          meta: undefined,
          timestamp: "2026-01-01T00:00:00.000Z",
          pendingSync: 0,
        },
      ]);
    });
  });

  describe("pushActivitiesToServer", () => {
    it("upserts activities scoped to the current user, mapped to snake_case", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pushActivitiesToServer } = await import("./api");
      await pushActivitiesToServer([
        {
          id: "act-1",
          declarationId: "decl-1",
          type: "created",
          title: "Declaration created",
          description: "Tax Year 2025",
          timestamp: "2026-01-01T00:00:00.000Z",
          pendingSync: 1,
        },
      ]);

      expect(builder.upsert).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "act-1",
          user_id: "user-uuid-1",
          declaration_id: "decl-1",
          type: "created",
          title: "Declaration created",
          description: "Tax Year 2025",
          timestamp: "2026-01-01T00:00:00.000Z",
        }),
      ]);
    });
  });

  describe("deleteDeclarationFromServer", () => {
    it("deletes scoped to both the declaration id and the current user", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { deleteDeclarationFromServer } = await import("./api");
      await deleteDeclarationFromServer("decl-1");

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "decl-1");
      expect(builder.eq).toHaveBeenCalledWith("user_id", "user-uuid-1");
    });

    it("throws when the server reports an error (e.g. RLS refused a still-held declaration)", async () => {
      fromMock.mockReturnValue(makeQueryBuilder({ data: null, error: { message: "permission denied" } }));

      const { deleteDeclarationFromServer } = await import("./api");

      await expect(deleteDeclarationFromServer("decl-1")).rejects.toBeTruthy();
    });
  });

  describe("pseudonymizeProfileOnServer", () => {
    it("nulls identifying fields but leaves tax_id and country untouched", async () => {
      const builder = makeQueryBuilder({ data: null, error: null });
      fromMock.mockReturnValue(builder);

      const { pseudonymizeProfileOnServer } = await import("./api");
      await pseudonymizeProfileOnServer();

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          phone: "",
          date_of_birth: null,
          country_of_birth: null,
          gender: null,
          nationality: null,
        })
      );
      const updatePayload = vi.mocked(builder.update).mock.calls[0][0] as Record<string, unknown>;
      expect(updatePayload).not.toHaveProperty("tax_id");
      expect(updatePayload).not.toHaveProperty("country");
      expect(updatePayload.pseudonymized_at).toEqual(expect.any(String));
      expect(builder.eq).toHaveBeenCalledWith("id", "user-uuid-1");
    });
  });

  describe("auth scoping", () => {
    it("throws instead of silently querying with no user scope when there's no session", async () => {
      getUserMock.mockResolvedValue({ data: { user: null } });
      fromMock.mockReturnValue(makeQueryBuilder({ data: [], error: null }));

      const { fetchDeclarationsFromServer } = await import("./api");

      await expect(fetchDeclarationsFromServer()).rejects.toThrow("Not authenticated");
    });
  });
});
