import { describe, expect, it } from "vitest";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import type { JurisdictionCapability } from "@/domain/jurisdictions";
import {
  getDeadlineSourceLabel,
  resolveDeadline,
} from "@/lib/deadline-service";

const now = new Date("2026-01-01T00:00:00.000Z");

const evidence = (dueAt: string, overrides: Record<string, unknown> = {}) => ({
  dueAt,
  taxYear: "2026",
  source: "https://authority.example/deadlines",
  verifiedAt: "2025-12-01T00:00:00.000Z",
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
    ...extra,
  }) as JurisdictionCapability;

describe("deadline service", () => {
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
      getJurisdictionCapability("NG-FCT"),
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
    expect(resolved.verifiedAt).toBe("2025-12-01T00:00:00.000Z");
  });

  it("does not treat a deadline with future effectiveFrom as verified", () => {
    const resolved = resolveDeadline(
      capabilityWithProfile({
        kind: "verified_state",
        evidence: evidence("2026-06-30T23:59:59+01:00", {
          effectiveFrom: "2026-02-01T00:00:00.000Z",
        }),
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
