/**
 * Mock external API layer.
 * Replace these implementations with real fetch() calls when the backend is ready.
 */

import type { LocalActivity, LocalDeclaration, LocalProfile } from "./local-db";

// Simulated network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ── Profile ──────────────────────────────────────────────
export async function fetchProfileFromServer(): Promise<LocalProfile> {
  await delay();
  return {
    id: "user-001",
    name: "Amara Okafor",
    email: "amara@example.com",
    phone: "+234 812 345 6789",
    taxId: "A012345678Z",
    country: "ng",
    dateOfBirth: "1990-05-15",
    countryOfBirth: "ng",
    gender: "Female",
    nationality: "Nigerian",
  };
}

export async function pushProfileToServer(profile: LocalProfile): Promise<void> {
  await delay();
  console.log("[mock-api] Profile pushed to server", profile);
}

// ── Declarations ─────────────────────────────────────────
export async function fetchDeclarationsFromServer(): Promise<LocalDeclaration[]> {
  await delay();
  return [
    {
      id: "decl-001",
      taxYear: "2025",
      country: "ng",
      type: "Income Tax",
      status: "approved",
      formData: {},
      documents: [],
      amount: "NGN 120,000",
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-20T00:00:00Z",
      syncedAt: new Date().toISOString(),
      pendingSync: 0,
    },
    {
      id: "decl-002",
      taxYear: "2025",
      country: "ng",
      type: "VAT Return",
      status: "processing",
      formData: {},
      documents: [],
      amount: "NGN 45,200",
      createdAt: "2026-02-28T00:00:00Z",
      updatedAt: "2026-02-28T00:00:00Z",
      syncedAt: new Date().toISOString(),
      pendingSync: 0,
    },
    {
      id: "decl-003",
      taxYear: "2024",
      country: "ng",
      type: "Income Tax",
      status: "audit_request",
      formData: {},
      documents: [],
      amount: "NGN 8,500",
      createdAt: "2026-02-10T00:00:00Z",
      updatedAt: "2026-02-10T00:00:00Z",
      syncedAt: new Date().toISOString(),
      pendingSync: 0,
    },
  ];
}

export async function pushDeclarationsToServer(
  declarations: LocalDeclaration[]
): Promise<void> {
  await delay();
  console.log("[mock-api] Declarations pushed to server", declarations.length);
}

// ── Reference Data ───────────────────────────────────────
export async function fetchReferenceDataFromServer(): Promise<
  Record<string, any>
> {
  await delay();
  return {
    taxRates: {
      ng: { personalIncome: [0.07, 0.11, 0.15, 0.19, 0.21, 0.24] },
    },
    taxYears: ["2023", "2024", "2025"],
    supportedCountries: ["ng"],
  };
}

// ── Activities ───────────────────────────────────────────
export async function fetchActivitiesFromServer(): Promise<LocalActivity[]> {
  await delay();
  return [
    {
      id: "act-001",
      declarationId: "decl-001",
      type: "created",
      title: "Declaration created",
      description: "Income Tax declaration for 2025 was filed.",
      timestamp: "2026-01-15T09:00:00Z",
    },
    {
      id: "act-002",
      declarationId: "decl-001",
      type: "status_change",
      title: "Status changed to Submitted",
      description: "Your declaration has been submitted for review.",
      timestamp: "2026-01-15T09:01:00Z",
      meta: { from: "draft", to: "submitted" },
    },
    {
      id: "act-003",
      declarationId: "decl-001",
      type: "status_change",
      title: "Status changed to Processing",
      description: "Your declaration is being reviewed by tax authorities.",
      timestamp: "2026-01-17T14:30:00Z",
      meta: { from: "submitted", to: "processing" },
    },
    {
      id: "act-004",
      declarationId: "decl-001",
      type: "status_change",
      title: "Status changed to Approved",
      description: "Your Income Tax declaration has been approved.",
      timestamp: "2026-01-20T10:00:00Z",
      meta: { from: "processing", to: "approved" },
    },
    {
      id: "act-005",
      declarationId: "decl-002",
      type: "created",
      title: "Declaration created",
      description: "VAT Return declaration for 2025 was filed.",
      timestamp: "2026-02-28T08:00:00Z",
    },
    {
      id: "act-006",
      declarationId: "decl-002",
      type: "status_change",
      title: "Status changed to Processing",
      description: "Your VAT Return is being reviewed.",
      timestamp: "2026-02-28T08:05:00Z",
      meta: { from: "submitted", to: "processing" },
    },
    {
      id: "act-007",
      declarationId: "decl-003",
      type: "created",
      title: "Declaration created",
      description: "Income Tax declaration for 2024 was filed.",
      timestamp: "2026-02-10T07:00:00Z",
    },
    {
      id: "act-008",
      declarationId: "decl-003",
      type: "status_change",
      title: "Status changed to Processing",
      description: "Your declaration is being reviewed.",
      timestamp: "2026-02-12T11:00:00Z",
      meta: { from: "submitted", to: "processing" },
    },
    {
      id: "act-009",
      declarationId: "decl-003",
      type: "status_change",
      title: "Audit Request",
      description: "Tax authorities have requested additional documentation for your Income Tax 2024.",
      timestamp: "2026-02-15T16:00:00Z",
      meta: { from: "processing", to: "audit_request" },
    },
  ];
}
