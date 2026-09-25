import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// Where the "view this message" link in the email points. Override via the
// APP_URL secret once a production domain exists; the demo URL is a
// reasonable default for now, not a hardcoded assumption about the future.
const APP_URL = Deno.env.get("APP_URL") ?? "https://filesmart-demo.netlify.app";
// Resend's shared sandbox sender, until a verified sending domain exists —
// override via the RESEND_FROM_ADDRESS secret once one is set up.
const FROM_ADDRESS = Deno.env.get("RESEND_FROM_ADDRESS") ?? "onboarding@resend.dev";

interface MessageWebhookPayload {
  type: "INSERT";
  table: "messages";
  record: {
    id: string;
    recipient_user_id: string;
    subject: string;
    body: string;
    category: string;
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[send-message-email] Missing required environment secrets");
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: MessageWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const message = payload.record;
  if (!message?.recipient_user_id || !message.subject || !message.body) {
    console.error("[send-message-email] Payload missing required fields:", payload);
    return new Response("Missing required message fields", { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    message.recipient_user_id
  );
  if (userError || !userData?.user?.email) {
    console.error("[send-message-email] Could not resolve recipient email:", userError);
    return new Response("Recipient email not found", { status: 404 });
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: userData.user.email,
      subject: message.subject,
      html: `<p>${escapeHtml(message.body)}</p><p><a href="${APP_URL}/messages">View this message in FileSmart</a></p>`,
    }),
  });

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
