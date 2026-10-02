import {
  hasRequiredCapabilityEvidence,
  type ApiStatus,
  type BaselineMetadata,
  type CapabilityEvidence,
  type DeadlineEvidenceMetadata,
  type DeadlineProfile,
  type EvidenceConfidence,
  type EvidenceMetadata,
  type ExportFormat,
  type JurisdictionCapability,
  type RuleProfile,
  type SubmissionMode,
} from "@/domain/jurisdictions";
import { listNigeriaJurisdictions } from "@/data/jurisdiction-registry";
import { db } from "@/lib/local-db";
import { getPublicRuntimeConfig } from "@/lib/runtime-config";

interface CapabilityCache {
  read: () => Promise<unknown>;
  write: (capabilities: JurisdictionCapability[]) => Promise<void>;
}

export interface JurisdictionServiceOptions {
  refresh?: () => Promise<unknown>;
  cache?: CapabilityCache;
  readCache?: () => Promise<unknown>;
  writeCache?: (capabilities: JurisdictionCapability[]) => Promise<void>;
  fetchImpl?: typeof fetch;
}

const READINESS_LABELS = new Set([
  "Not yet supported",
  "Guided manual filing",
  "Portal-ready export",
  "Direct filing",
]);
const SUBMISSION_MODES = new Set<SubmissionMode>([
  "adapter",
  "validated_export",
  "guided_manual",
  "generic_export",
]);
const EXPORT_FORMATS = new Set<ExportFormat>(["pdf", "csv", "xlsx"]);
const API_STATUSES = new Set<ApiStatus>([
  "not_pursued",
  "discovery",
  "access_requested",
  "sandbox",
  "validated",
  "production_ready",
]);
const EVIDENCE_CONFIDENCES = new Set<EvidenceConfidence>([
  "high",
  "medium",
  "low",
]);

function defaultCache(): CapabilityCache {
  return {
    read: () => db.jurisdictionCapabilities.toArray(),
    write: async (capabilities) => {
      await db.jurisdictionCapabilities.bulkPut(capabilities);
    },
  };
}

async function fetchRegistry(fetchImpl: typeof fetch): Promise<unknown> {
  const endpoint = getPublicRuntimeConfig().endpoints.jurisdictionCapabilities;
  if (!endpoint) return undefined;

  const response = await fetchImpl(endpoint, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Jurisdiction registry refresh failed.");

  const payload = await response.json();
  return Array.isArray(payload) ? payload : (payload as { capabilities?: unknown })?.capabilities;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function safeText(value: unknown, required = false): string | undefined {
  if (typeof value !== "string") return required ? undefined : undefined;
  const text = value.trim();
  // Intentional control-character rejection for untrusted registry metadata.
  // eslint-disable-next-line no-control-regex
  if (!text || text.length > 1000 || /[\u0000-\u001f\u007f]/.test(text)) {
    return undefined;
  }
  return text;
}

function sanitizeEvidence(value: unknown, deadline = false): EvidenceMetadata | DeadlineEvidenceMetadata | undefined {
  if (!isRecord(value)) return undefined;
  const source = safeText(value.source, true);
  const effectiveFrom = safeText(value.effectiveFrom, true);
  const verifiedAt = safeText(value.verifiedAt, true);
  const confidence = value.confidence;
  if (!source || !effectiveFrom || !verifiedAt || !EVIDENCE_CONFIDENCES.has(confidence as EvidenceConfidence)) {
    return undefined;
  }

  const evidence: EvidenceMetadata = {
    source,
    effectiveFrom,
    ...(safeText(value.effectiveTo) ? { effectiveTo: safeText(value.effectiveTo) } : {}),
    verifiedAt,
    confidence: confidence as EvidenceConfidence,
  };
  if (!deadline) return evidence;

  const dueAt = safeText(value.dueAt, true);
  const taxYear = safeText(value.taxYear, true);
  const timezone = safeText(value.timezone, true);
  if (!dueAt || !taxYear || !timezone) return undefined;
  return {
    ...evidence,
    dueAt,
    taxYear,
    timezone,
    ...(safeText(value.recurrence) ? { recurrence: safeText(value.recurrence) } : {}),
  };
}

function sanitizeBaseline(value: unknown): BaselineMetadata | undefined {
  if (!isRecord(value)) return undefined;
  const source = safeText(value.source);
  const effectiveFrom = safeText(value.effectiveFrom);
  const reviewedAt = safeText(value.reviewedAt);
  const status = value.status === "configured" || value.status === "unconfigured"
    ? value.status
    : undefined;
  if (
    (status !== undefined && status !== "configured" && status !== "unconfigured") ||
    source === undefined ||
    effectiveFrom === undefined ||
    reviewedAt === undefined
  ) {
    return undefined;
  }
  return {
    ...(status ? { status } : {}),
    source,
    effectiveFrom,
    ...(safeText(value.effectiveTo) ? { effectiveTo: safeText(value.effectiveTo) } : {}),
    reviewedAt,
  };
}

function sanitizeRuleProfile(value: unknown): RuleProfile | undefined {
  if (!isRecord(value)) return undefined;
  const kind = value.kind;
  const profileId = safeText(value.profileId, true);
  const version = safeText(value.version);
  if (!profileId || version === undefined) return undefined;

  if (kind === "verified_state") {
    const evidence = sanitizeEvidence(value.evidence);
    if (!evidence) return undefined;
    return { kind, profileId, version, evidence };
  }

  if (kind === "generic_nigerian_pit" && profileId === "ng-pit-baseline") {
    const baseline = sanitizeBaseline(value.baseline);
    if (!baseline) return undefined;
    return { kind, profileId: "ng-pit-baseline", version, baseline };
  }
  return undefined;
}

function sanitizeDeadlineProfile(value: unknown): DeadlineProfile | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind === "unverified" && value.confidence === "low") {
    return { kind: "unverified", confidence: "low" };
  }
  if (value.kind !== "verified_state" && value.kind !== "national_baseline") return undefined;
  const evidence = sanitizeEvidence(value.evidence, true);
  return evidence && "dueAt" in evidence
    ? { kind: value.kind, evidence }
    : undefined;
}

function sanitizeCapability(value: unknown): JurisdictionCapability | undefined {
  if (!isRecord(value)) return undefined;
  const jurisdictionCode = safeText(value.jurisdictionCode, true)?.toUpperCase();
  const name = safeText(value.name, true);
  const shortName = safeText(value.shortName, true);
  const registryVersion = safeText(value.registryVersion, true);
  const ruleProfile = sanitizeRuleProfile(value.ruleProfile);
  const deadlineProfile = sanitizeDeadlineProfile(value.deadlineProfile);
  const nationalDeadlineProfile = value.nationalDeadlineProfile === undefined
    ? undefined
    : sanitizeDeadlineProfile(value.nationalDeadlineProfile);
  const submissionModes = Array.isArray(value.submissionModes)
    ? value.submissionModes.filter((mode): mode is SubmissionMode => SUBMISSION_MODES.has(mode as SubmissionMode))
    : [];
  const exportFormats = Array.isArray(value.exportFormats)
    ? value.exportFormats.filter((format): format is ExportFormat => EXPORT_FORMATS.has(format as ExportFormat))
    : [];
  const apiStatus = value.apiStatus as ApiStatus;

  if (
    !jurisdictionCode?.startsWith("NG-") ||
    !name ||
    !shortName ||
    value.countryCode !== "NG" ||
    !registryVersion ||
    !ruleProfile ||
    !deadlineProfile ||
    (value.nationalDeadlineProfile !== undefined && !nationalDeadlineProfile) ||
    submissionModes.length === 0 ||
    exportFormats.length === 0 ||
    !API_STATUSES.has(apiStatus) ||
    !READINESS_LABELS.has(value.primaryReadiness as string) ||
    !isRecord(value.evidence) ||
    safeText(value.notes) === undefined
  ) {
    return undefined;
  }

  const evidence: { template?: EvidenceMetadata; integration?: EvidenceMetadata } = {};
  for (const key of ["template", "integration"] as const) {
    if (value.evidence[key] !== undefined) {
      const sanitized = sanitizeEvidence(value.evidence[key]);
      if (!sanitized) return undefined;
      evidence[key] = sanitized;
    }
  }

  const capability: JurisdictionCapability = {
    jurisdictionCode,
    name,
    shortName,
    countryCode: "NG",
    ruleProfile,
    primaryReadiness: value.primaryReadiness as JurisdictionCapability["primaryReadiness"],
    submissionModes,
    apiStatus,
    deadlineProfile,
    ...(nationalDeadlineProfile ? { nationalDeadlineProfile } : {}),
    exportFormats,
    evidence,
    notes: safeText(value.notes)!,
    registryVersion,
  };
  return hasRequiredCapabilityEvidence(capability) ? capability : undefined;
}

function versionParts(version: string): number[] {
  return version.split(".").map((part) => Number.parseInt(part, 10)).map((part) => Number.isFinite(part) ? part : 0);
}

function compareVersions(left: string, right: string): number {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return left.localeCompare(right);
}

function validatedCapabilities(overlays: unknown): JurisdictionCapability[] {
  if (!Array.isArray(overlays)) return [];

  return overlays.flatMap((rawCapability) => {
    const capability = sanitizeCapability(rawCapability);
    return capability ? [capability] : [];
  });
}

function mergeCapabilities(
  bundled: readonly JurisdictionCapability[],
  overlays: unknown,
  options: { readonly allowEqualVersion?: boolean } = {},
): JurisdictionCapability[] {
  const byCode = new Map(bundled.map((capability) => [capability.jurisdictionCode, capability]));

  for (const capability of validatedCapabilities(overlays)) {
    const bundledCapability = byCode.get(capability.jurisdictionCode);
    if (!bundledCapability) {
      continue;
    }
    const versionComparison = compareVersions(
      capability.registryVersion,
      bundledCapability.registryVersion,
    );
    if (
      versionComparison < 0 ||
      (versionComparison === 0 && options.allowEqualVersion !== true)
    ) {
      continue;
    }
    byCode.set(capability.jurisdictionCode, capability);
  }

  return bundled.map((capability) => byCode.get(capability.jurisdictionCode) ?? capability);
}

export async function loadJurisdictionCapabilities(
  options: JurisdictionServiceOptions = {},
): Promise<JurisdictionCapability[]> {
  const bundled = listNigeriaJurisdictions();
  const defaultCacheInstance = defaultCache();
  const cache = options.cache ?? {
    read: options.readCache ?? defaultCacheInstance.read,
    write: options.writeCache ?? defaultCacheInstance.write,
  };

  let cached: unknown;
  try {
    cached = await cache.read();
  } catch {
    cached = undefined;
  }

  // Cached entries may legitimately equal the bundled version while carrying
  // richer verified evidence. A refresh at that same version may not replace
  // them unless a newer registry version is supplied.
  let capabilities = mergeCapabilities(bundled, cached, { allowEqualVersion: true });
  const refresh = options.refresh ?? (() => fetchRegistry(options.fetchImpl ?? fetch));
  try {
    const refreshed = await refresh();
    capabilities = mergeCapabilities(capabilities, validatedCapabilities(refreshed));
    try {
      await cache.write(capabilities);
    } catch {
      // Local cache failure must not block generic preparation.
    }
  } catch {
    // Offline or failed refresh keeps the bundled/cached conservative registry.
  }

  return capabilities;
}
