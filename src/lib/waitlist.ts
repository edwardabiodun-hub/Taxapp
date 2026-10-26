import { supabase } from "@/lib/supabase-client";

export type WaitlistStatus = "joined" | "already_joined";

export class WaitlistError extends Error {
  constructor(public readonly code: "unavailable" | "rate_limit" | "invalid") {
    super(code);
  }
}

interface WaitlistInput {
  email: string;
  name: string;
  source: string;
  notificationConsent: boolean;
}

export async function joinLaunchWaitlist(input: WaitlistInput): Promise<{ status: WaitlistStatus }> {
  const { data, error } = await supabase.rpc("join_launch_waitlist", {
    p_email: input.email.trim(),
    p_name: input.name.trim() || null,
    p_source: input.source,
    p_notification_consent: input.notificationConsent,
  });

  if (error) {
    if (error.message.toLowerCase().includes("rate limit")) throw new WaitlistError("rate_limit");
    if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("consent")) throw new WaitlistError("invalid");
    throw new WaitlistError("unavailable");
  }

  const status = Array.isArray(data) ? data[0]?.status : undefined;
  return { status: status === "already_joined" ? "already_joined" : "joined" };
}
