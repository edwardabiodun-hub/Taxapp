import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import {
  getDeadlineSourceLabel,
  resolveDeadline,
} from "@/lib/deadline-service";

const now = new Date("2026-10-06T00:00:00.000Z");

const evidence = (dueAt: string, overrides: Record<string, unknown> = {}) => ({
  dueAt,
  taxYear: "2026",
  source: "https://authority.example/deadlines",
  verifiedAt: "2026-09-01T00:00:00.000Z",
  effectiveFrom: "2025-01-01T00:00:00.000Z",
  confidence: "high",
  timezone: "Africa/Lagos",
  ...overrides,
});

const capabilityWithProfile = (
  deadlineProfile: unknown,
  extra: Record<string, unknown> = {},
): JurisdictionCapability =>
  ({
    ...getJurisdictionCapability("NG-LA"),
    deadlineProfile,
    nationalDeadlineProfile: undefined,
    ...extra,
  }) as JurisdictionCapability;

describe("deadline service", () => {
  it("resolves 2026 income-year PIT to March 31, 2027", () => {
    const resolved = resolveDeadline(
      getJurisdictionCapability("NG-LA"),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("national_baseline");
    expect(resolved.dueAt).toBe("2027-03-31T23:59:59+01:00");
    expect(resolved.filingBasis).toContain("January 1, 2026");
    expect(resolved.eligibilityNote).toContain("taxable individuals");
    expect(resolved.penaltyNote).toContain("₦100,000");
  });

  it("prefers a verified state deadline over the national baseline", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile(
        { kind: "verified_state", evidence: evidence("2026-06-30T23:59:59+01:00") },
        {
          nationalDeadlineProfile: {
            kind: "national_baseline",
            evidence: evidence("2026-04-30T23:59:59+01:00"),
          },
        },
      ),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("verified_state");
    expect(resolved.label).toContain("State deadline");
    expect(resolved.dueAt).toBe("2026-06-30T23:59:59+01:00");
  });

  it("uses a national baseline with an explicit caveat when state data is unavailable", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "national_baseline",
        evidence: evidence("2026-04-30T23:59:59+01:00"),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("national_baseline");
    expect(resolved.label).toContain("confirm with your tax authority");
    expect(resolved.isStale).toBe(false);
  });

  it("fails closed when the registry has no configured deadline source", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({ kind: "unverified", confidence: "low" }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.label).toBe("Deadline not verified");
    expect(resolved.dueAt).toBeUndefined();
  });

  it("rejects a deadline or verification timestamp without an explicit timezone", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59", {
          verifiedAt: "2025-12-01",
        }),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
    expect(resolved.label).toBe("Deadline not verified");
  });

  it("does not treat expired source metadata as a verified deadline", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", {
          effectiveTo: "2025-12-31T23:59:59.000Z",
        }),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
    expect(resolved.verifiedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("does not treat a deadline with future effectiveFrom as verified", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", {
          effectiveFrom: "2027-02-01T00:00:00.000Z",
        }),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
  });

  it("marks evidence older than one quarterly review cycle as stale", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", {
          verifiedAt: "2026-05-01T00:00:00.000Z",
        }),
      }),
      "2026",
      new Date("2026-10-06T00:00:00.000Z"),
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
  });

  it("rejects an unknown IANA timezone", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", { timezone: "Africa/NotARealCity" }),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
  });

  it("requires explicit effectiveFrom metadata for verified sources", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", {
          effectiveFrom: undefined,
        }),
      }),
      "2026",
      now,
    );

    expect(resolved.sourceKind).toBe("unverified");
    expect(resolved.isStale).toBe(true);
  });

  it("exposes stable source labels for cards", () => {
    expect(getDeadlineSourceLabel("verified_state")).toBe("State deadline");
    expect(getDeadlineSourceLabel("national_baseline")).toBe(
      "National statutory baseline — confirm with your tax authority",
    );
    expect(getDeadlineSourceLabel("unverified")).toBe("Deadline not verified");
  });
});
