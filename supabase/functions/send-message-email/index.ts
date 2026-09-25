import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// Shared secret sent by the Supabase Database Webhook as a custom header
// (configured in the Dashboard when the webhook is set up). Without this,
// the anon key alone (shipped in every client bundle, valid for the
// function's default verify_jwt check) would let anyone POST directly to
// this function's URL and trigger an email to any user whose UUID they
// know. See Fix 1 for the full threat model.
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET");
// Where the "view this message" link in the email points. Override via the
// APP_URL secret once a production domain exists; the demo URL is a
// reasonable default for now, not a hardcoded assumption about the future.
const APP_URL = Deno.env.get("APP_URL") ?? "https://filesmart-demo.netlify.app";
// Resend's shared sandbox sender, until a verified sending domain exists —
// override via the RESEND_FROM_ADDRESS secret once one is set up.
const FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") ?? "onboarding@resend.dev";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !WEBHOOK_SECRET) {
    console.error("[send-message-email] Missing required environment secrets");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Auth boundary: only a request carrying this shared secret (set on the
  // Database Webhook's own custom headers, never shipped to clients) may
  // proceed. This is checked before any payload parsing.
  const providedSecret = req.headers.get("x-webhook-secret");
  if (providedSecret !== WEBHOOK_SECRET) {
    console.error("[send-message-email] Rejected request with missing or invalid webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  // Minimal parse for routing (type/table) and the new row's id. These
  // outer fields come from Supabase's own webhook infrastructure (trusted,
  // now that the secret check above has passed) — but we still guard every
  // property access defensively so a malformed payload can't crash this
  // unhandled. Everything else about the message (recipient, subject,
  // body) is deliberately NOT read from this payload — see Fix 1(b) below,
  // which re-reads it from the database instead of trusting the caller.
  const payloadObj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
  const eventType = payloadObj?.type;
  const eventTable = payloadObj?.table;
  const record = payloadObj?.record;
  const messageId =
    record && typeof record === "object" ? (record as Record<string, unknown>).id : undefined;

  // The webhook could be misconfigured (in the Dashboard's checkboxes) to
  // also fire on UPDATE/DELETE — e.g. a mark-read UPDATE would otherwise
  // re-send the email every time someone opens a message. This is a
  // routing decision, not a security boundary, so we just no-op with 200.
  if (eventType !== "INSERT" || eventTable !== "messages") {
    return new Response("OK", { status: 200 });
  }

  if (typeof messageId !== "string" || !messageId) {
    console.error("[send-message-email] Payload missing record.id");
    return new Response("Missing record id", { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Re-read the row from the database rather than trusting the payload's
  // content. This is the actual fix for the content-injection hole: even
  // if the secret check above were somehow bypassed, an attacker could not
  // inject arbitrary email subject/body — only genuinely stored message
  // rows (created by staff via privileged Supabase access) are ever sent.
  const { data: messageRow, error: fetchError } = await supabaseAdmin
    .from("messages")
    .select("recipient_user_id, subject, body")
    .eq("id", messageId)
    .single();

  if (fetchError || !messageRow) {
    console.error("[send-message-email] Could not find message row:", fetchError);
    return new Response("Message not found", { status: 404 });
  }

  // recipient_user_id comes from a trusted `uuid not null references
  // auth.users(id)` column — always a structurally valid UUID — so no
  // separate format validation is needed before this call.
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    messageRow.recipient_user_id
  );
  if (userError || !userData?.user?.email) {
    console.error("[send-message-email] Could not resolve recipient email:", userError);
    return new Response("Recipient email not found", { status: 404 });
  }

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: userData.user.email,
        subject: messageRow.subject,
        html: `<p>${escapeHtml(messageRow.body)}</p><p><a href="${APP_URL}/messages">View this message in FileSmart</a></p>`,
      }),
    });
  } catch (err) {
    // A network failure, DNS error, or timeout throws before we ever get a
    // Response object — catch it here rather than letting it become an
    // unhandled exception. Never log RESEND_API_KEY itself.
    console.error("[send-message-email] Failed to reach Resend:", err);
    return new Response("Failed to send email", { status: 502 });
  }

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    console.error("[send-message-email] Resend API error:", resendResponse.status, errorText);
    // Deliberately not retried, and this failure never touches the
    // messages row itself — the message is already saved and visible
    // in-app regardless of whether this email send succeeds.
    return new Response("Failed to send email", { status: 502 });
  }

  return new Response("OK", { status: 200 });
});
