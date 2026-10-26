import { supabase } from "./supabase-client";
import type {
  LocalActivity,
  LocalDeclaration,
  LocalMessage,
  LocalNotificationPreferences,
  LocalPreparationReminderState,
  LocalProfile,
} from "./local-db";
import type { PreparationRecord } from "@/domain/preparations";
import { getJurisdictionCapability } from "@/data/jurisdiction-registry";
import { resolveDeadline } from "@/lib/deadline-service";

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

export interface ProfileRow {
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

export function rowToProfile(row: ProfileRow, email = ""): LocalProfile {
  return {
    id: row.id,
    name: row.name,
    email,
    phone: row.phone,
    taxId: row.tax_id,
    country: row.country,
    dateOfBirth: row.date_of_birth ?? undefined,
    countryOfBirth: row.country_of_birth ?? undefined,
    gender: row.gender ?? undefined,
    nationality: row.nationality ?? undefined,
    consentAcceptedAt: row.consent_accepted_at ?? undefined,
  };
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
    .select("id,name,phone,tax_id,country,date_of_birth,country_of_birth,gender,nationality,consent_accepted_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  if (!data) return null;

  return rowToProfile(data, userData.user?.email ?? "");
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

/**
 * Nulls out contact/identity fields on a deletion request, but deliberately
 * leaves tax_id and country untouched: any declaration still inside its
 * NTAA retention hold needs to remain attributable to a real taxpayer if
 * FIRS ever asks for it, and tax_id is how that linkage stays meaningful.
 * Full removal of even those fields is a separate step, only safe once
 * every declaration referencing this profile has cleared its own hold —
 * not attempted here (see account-deletion.ts and the retention research).
 */
export async function pseudonymizeProfileOnServer(): Promise<void> {
  const { error } = await supabase.rpc("pseudonymize_own_profile");
  if (error) throw error;
}

// ── Declarations ─────────────────────────────────────────

export interface DeclarationRow {
  id: string;
  tax_year: string;
  country: string;
  state: string | null;
  type: string;
  status: LocalDeclaration["status"];
  form_data: Record<string, string>;
  documents: LocalDeclaration["documents"];
  amount: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToDeclaration(row: DeclarationRow): LocalDeclaration {
  return {
    id: row.id,
    taxYear: row.tax_year,
    country: row.country,
    state: row.state ?? undefined,
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
    .select("id,tax_year,country,state,type,status,form_data,documents,amount,created_at,updated_at")
    .eq("user_id", userId)
    .returns<DeclarationRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToDeclaration);
}

/**
 * Deletes a single declaration server-side. Scoped by both id and user_id,
 * but the real enforcement boundary is the RLS delete policy itself
 * ("delete own declarations outside retention hold"), which independently
 * refuses this at the database level if the declaration is still inside
 * its NTAA retention window — this call can safely be attempted even if
 * the caller's own isUnderRetentionHold() check has a bug, since the
 * database is the backstop, not this function.
 */
export async function deleteDeclarationFromServer(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("declarations").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function pushDeclarationsToServer(declarations: LocalDeclaration[]): Promise<void> {
  const userId = await getCurrentUserId();
  const rows = declarations.map((d) => ({
    id: d.id,
    user_id: userId,
    tax_year: d.taxYear,
    country: d.country,
    state: d.state ?? null,
    type: d.type,
    status: d.status,
    form_data: d.formData,
    documents: d.documents,
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

export interface ActivityRow {
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
    .select("id,declaration_id,type,title,description,meta,timestamp")
    .eq("user_id", userId)
    .returns<ActivityRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToActivity);
}

export function rowToActivity(row: ActivityRow): LocalActivity {
  return {
    id: row.id,
    declarationId: row.declaration_id,
    type: row.type,
    title: row.title,
    description: row.description ?? undefined,
    meta: row.meta ?? undefined,
    timestamp: row.timestamp,
    pendingSync: 0,
  };
}

export async function pushActivitiesToServer(activities: LocalActivity[]): Promise<void> {
  const userId = await getCurrentUserId();
  const rows = activities.map((a) => ({
    id: a.id,
    user_id: userId,
    declaration_id: a.declarationId,
    type: a.type,
    title: a.title,
    description: a.description ?? null,
    meta: a.meta ?? null,
    timestamp: a.timestamp,
  }));
  const { error } = await supabase.from("activities").upsert(rows);
  if (error) throw error;
}

// ── Messages ─────────────────────────────────────────────

export interface MessageRow {
  id: string;
  declaration_id: string | null;
  category: LocalMessage["category"];
  subject: string;
  body: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchMessagesFromServer(): Promise<LocalMessage[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("messages")
    .select("id,declaration_id,category,subject,body,action_url,read_at,created_at")
    .eq("recipient_user_id", userId)
    .returns<MessageRow[]>();
  if (error) throw error;
  return (data ?? []).map(rowToMessage);
}

export function rowToMessage(row: MessageRow): LocalMessage {
  return {
    id: row.id,
    declarationId: row.declaration_id ?? undefined,
    category: row.category,
    subject: row.subject,
    body: row.body,
    actionUrl: row.action_url ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
    pendingSync: 0,
  };
}

/** Pushes only the read_at change for one message. The server's column
 * grant (see the messages migration) rejects anything beyond read_at, so
 * this intentionally sends nothing else — no need to also scope by user
 * id here, since RLS already restricts which row this can touch. */
export async function pushMessageReadStatus(id: string, readAt: string): Promise<void> {
  const { error } = await supabase.from("messages").update({ read_at: readAt }).eq("id", id);
  if (error) throw error;
}

// ── Preparation reminder state ──────────────────────────

export interface PreparationReminderStateRow {
  preparation_id: string;
  user_id: string;
  tax_year: string;
  jurisdiction_code: string;
  status: LocalPreparationReminderState["status"];
  last_meaningful_activity_at: string;
  last_resumed_at: string | null;
  submitted_at: string | null;
  deleted_at: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
  reminder_dismissed_at: string | null;
  snoozed_until: string | null;
  deadline_due_at: string | null;
  deadline_source: string | null;
  created_at: string;
  updated_at: string;
}

function reminderStateFromPreparation(
  preparation: PreparationRecord,
): Omit<PreparationReminderStateRow, "user_id"> {
  const deadline = resolveDeadline(
    getJurisdictionCapability(preparation.jurisdictionCode),
    preparation.taxYear,
    new Date(preparation.updatedAt),
  );

  return {
    preparation_id: preparation.id,
    tax_year: preparation.taxYear,
    jurisdiction_code: preparation.jurisdictionCode,
    status: preparation.status,
    last_meaningful_activity_at: preparation.updatedAt,
    last_resumed_at: null,
    submitted_at: preparation.status === "user_submitted" || preparation.status === "authority_confirmed"
      ? preparation.updatedAt
      : null,
    deleted_at: null,
    reminder_count: 0,
    last_reminded_at: null,
    reminder_dismissed_at: null,
    snoozed_until: null,
    deadline_due_at: deadline.dueAt ?? null,
    deadline_source: deadline.source ?? null,
    created_at: preparation.createdAt,
    updated_at: preparation.updatedAt,
  };
}

export async function pushPreparationReminderStates(
  preparations: readonly PreparationRecord[],
): Promise<void> {
  if (preparations.length === 0) return;
  await getCurrentUserId();
  for (const preparation of preparations) {
    const row = reminderStateFromPreparation(preparation);
    const { error } = await supabase.rpc("sync_my_preparation_reminder_state", {
      p_preparation_id: row.preparation_id,
      p_tax_year: row.tax_year,
      p_jurisdiction_code: row.jurisdiction_code,
      p_status: row.status,
      p_last_meaningful_activity_at: row.last_meaningful_activity_at,
      p_submitted_at: row.submitted_at,
      p_deadline_due_at: row.deadline_due_at,
      p_deadline_source: row.deadline_source,
      p_created_at: row.created_at,
      p_updated_at: row.updated_at,
    });
    if (error) throw error;
  }
}

export async function fetchNotificationPreferences(): Promise<LocalNotificationPreferences | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("user_id,in_app_reminders_enabled,email_reminders_enabled,reminder_consent_at,unsubscribed_at,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    userId: data.user_id,
    inAppRemindersEnabled: data.in_app_reminders_enabled,
    emailRemindersEnabled: data.email_reminders_enabled,
    reminderConsentAt: data.reminder_consent_at ?? undefined,
    unsubscribedAt: data.unsubscribed_at ?? undefined,
    updatedAt: data.updated_at,
  };
}

export async function saveNotificationPreferences(
  preferences: Pick<LocalNotificationPreferences, "inAppRemindersEnabled" | "emailRemindersEnabled" | "reminderConsentAt" | "unsubscribedAt">,
): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("user_notification_preferences").upsert({
    user_id: userId,
    in_app_reminders_enabled: preferences.inAppRemindersEnabled,
    email_reminders_enabled: preferences.emailRemindersEnabled,
    reminder_consent_at: preferences.reminderConsentAt ?? null,
    unsubscribed_at: preferences.unsubscribedAt ?? null,
  });
  if (error) throw error;
}

export async function dismissPreparationReminders(preparationId: string): Promise<void> {
  await getCurrentUserId();
  const { error } = await supabase.rpc("dismiss_my_preparation_reminders", {
    p_preparation_id: preparationId,
  });
  if (error) throw error;
}
