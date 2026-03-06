/**
 * Mock external API layer.
 * Replace these implementations with real fetch() calls when the backend is ready.
 */

import type { LocalDeclaration, LocalProfile } from "./local-db";

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
      pendingSync: false,
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
      pendingSync: false,
    },
    {
      id: "decl-003",
      taxYear: "2024",
      country: "ng",
      type: "Income Tax",
      status: "submitted",
      formData: {},
      documents: [],
      amount: "NGN 8,500",
      createdAt: "2026-02-10T00:00:00Z",
      updatedAt: "2026-02-10T00:00:00Z",
      syncedAt: new Date().toISOString(),
      pendingSync: false,
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
