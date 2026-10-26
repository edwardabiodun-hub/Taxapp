import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("ABANDONED_PREPARATION_CRON_SECRET");
const APP_URL = Deno.env.get("APP_URL") ?? "https://filesmart-demo.netlify.app";
const INACTIVITY_MS = 24 * 60 * 60 * 1000;
const REMINDER_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REMINDERS = 2;

function formatDeadline(value: string | null): string {
  if (!value) return "the applicable filing deadline";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function buildResumeUrl(preparationId: string): string {
  const url = new URL("/declare", APP_URL);
  url.searchParams.set("preparation", preparationId);
  return url.toString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !CRON_SECRET) {
    return new Response("Server misconfigured", { status: 500 });
  }
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const cutoff = new Date(Date.now() - INACTIVITY_MS).toISOString();
  const cooldownCutoff = new Date(Date.now() - REMINDER_COOLDOWN_MS).toISOString();
  const { data: candidates, error } = await client
    .from("preparation_reminder_states")
    .select("preparation_id,user_id,tax_year,status,last_meaningful_activity_at,reminder_count,last_reminded_at,reminder_dismissed_at,snoozed_until,deadline_due_at")
    .eq("status", "draft")
    .lt("last_meaningful_activity_at", cutoff)
    .lt("reminder_count", MAX_REMINDERS);

  if (error) {
    console.error("[abandoned-preparation-reminders] candidate query failed", error);
    return new Response("Candidate query failed", { status: 500 });
  }

  let created = 0;
  for (const candidate of candidates ?? []) {
    if (candidate.reminder_dismissed_at || candidate.snoozed_until && candidate.snoozed_until > new Date().toISOString()) continue;
    if (candidate.last_reminded_at && candidate.last_reminded_at > cooldownCutoff) continue;

    const { data: preferences } = await client
      .from("user_notification_preferences")
      .select("in_app_reminders_enabled,unsubscribed_at")
      .eq("user_id", candidate.user_id)
      .maybeSingle();
    if (preferences?.in_app_reminders_enabled === false || preferences?.unsubscribed_at) continue;

    const deadline = formatDeadline(candidate.deadline_due_at);
    const resumeUrl = buildResumeUrl(candidate.preparation_id);
    const reminderKey = `${candidate.user_id}:${candidate.preparation_id}:${candidate.reminder_count + 1}`;
    const remindedAt = new Date().toISOString();
    const { error: insertError } = await client.from("messages").insert({
      recipient_user_id: candidate.user_id,
      category: "return_reminder",
      subject: `Your ${candidate.tax_year} tax preparation is waiting`,
      body: `You have a saved tax preparation to complete. The current deadline is ${deadline}.`,
      action_url: resumeUrl,
      reminder_key: reminderKey,
    });
    if (insertError) {
      if (insertError.code !== "23505") {
        console.error("[abandoned-preparation-reminders] message insert failed", insertError);
        continue;
      }
      // A concurrent invocation already created this reminder. Repair the
      // lifecycle counter if that invocation stopped after the insert.
      const { error: repairError } = await client
        .from("preparation_reminder_states")
        .update({ reminder_count: candidate.reminder_count + 1, last_reminded_at: remindedAt })
        .eq("preparation_id", candidate.preparation_id)
        .eq("user_id", candidate.user_id)
        .eq("reminder_count", candidate.reminder_count);
      if (repairError) console.error("[abandoned-preparation-reminders] reminder state repair failed", repairError);
      continue;
    }

    const { error: updateError } = await client
      .from("preparation_reminder_states")
      .update({ reminder_count: candidate.reminder_count + 1, last_reminded_at: remindedAt })
      .eq("preparation_id", candidate.preparation_id)
      .eq("user_id", candidate.user_id)
      .eq("reminder_count", candidate.reminder_count);
    if (!updateError) created += 1;
  }

  return Response.json({ created, scanned: candidates?.length ?? 0 });
});
