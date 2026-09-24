import { supabase } from "./supabase-client";
import type { LocalActivity, LocalDeclaration, LocalProfile } from "./local-db";

/**
 * Real backend calls, replacing mock-api.ts. Every function here requires
 * an active Supabase session — sync-service.ts's syncAll() is only ever
 * invoked from inside the authenticated app, so a missing session here
 * means something upstream is broken, not a case to handle gracefully.
 */
async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ── Profile ──────────────────────────────────────────────

interface ProfileRow {
  id: string;
  name: string;
  phone: string;
  tax_id: string;
  country: string;
  date_of_birth: string | null;
  country_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  consent_accepted_at: string | null;
}

/** Returns null if this user has never pushed a profile yet (e.g. the very
 * first sync, before pushProfileToServer has run once). */
export async function fetchProfileFromServer(): Promise<LocalProfile | null> {
  const [userId, { data: userData }] = await Promise.all([
    getCurrentUserId(),
    supabase.auth.getUser(),
  ]);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: userData.user?.email ?? "",
    phone: data.phone,
    taxId: data.tax_id,
    country: data.country,
    dateOfBirth: data.date_of_birth ?? undefined,
    countryOfBirth: data.country_of_birth ?? undefined,
    gender: data.gender ?? undefined,
    nationality: data.nationality ?? undefined,
    consentAcceptedAt: data.consent_accepted_at ?? undefined,
  };
}

export async function pushProfileToServer(profile: LocalProfile): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    name: profile.name,
    phone: profile.phone,
    tax_id: profile.taxId,
    country: profile.country,
    date_of_birth: profile.dateOfBirth || null,
    country_of_birth: profile.countryOfBirth || null,
    gender: profile.gender || null,
    nationality: profile.nationality || null,
    consent_accepted_at: profile.consentAcceptedAt || null,
  });
  if (error) throw error;
}

// ── Declarations ─────────────────────────────────────────

interface DeclarationRow {
  id: string;
  tax_year: string;
  country: string;
  type: string;
  status: LocalDeclaration["status"];
  form_data: Record<string, string>;
  documents: LocalDeclaration["documents"];
  amount: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDeclaration(row: DeclarationRow): LocalDeclaration {
  return {
    id: row.id,
    taxYear: row.tax_year,
    country: row.country,
    type: row.type,
    status: row.status,
    formData: row.form_data,
    documents: row.documents,
    amount: row.amount ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: new Date().toISOString(),
    pendingSync: 0,
  };
}

export async function fetchDeclarationsFromServer(): Promise<LocalDeclaration[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("declarations")
    .select("*")
    .eq("user_id", userId)
    .returns<DeclarationRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToDeclaration);
}

export async function pushDeclarationsToServer(declarations: LocalDeclaration[]): Promise<void> {
  const userId = await getCurrentUserId();
  const rows = declarations.map((d) => ({
    id: d.id,
    user_id: userId,
    tax_year: d.taxYear,
    country: d.country,
    type: d.type,
    status: d.status,
    form_data: d.formData,
    documents: d.documents,
    amount: d.amount ?? null,
    created_at: d.createdAt,
    // updated_at is deliberately NOT sent — a database trigger stamps it on
    // every insert/update. That's a different clock than local `updatedAt`
    // (which drives sync-service's own race-detection against the LOCAL
    // table) and the two were never meant to be the same value; letting the
    // server own its column avoids a subtle conflict between the two.
  }));
  const { error } = await supabase.from("declarations").upsert(rows);
  if (error) throw error;
}

// ── Activities ───────────────────────────────────────────

interface ActivityRow {
  id: string;
  declaration_id: string;
  type: LocalActivity["type"];
  title: string;
  description: string | null;
  meta: Record<string, unknown> | null;
  timestamp: string;
}

export async function fetchActivitiesFromServer(): Promise<LocalActivity[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .returns<ActivityRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    declarationId: row.declaration_id,
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    meta: row.meta ?? undefined,
    timestamp: row.timestamp,
  }));
}
