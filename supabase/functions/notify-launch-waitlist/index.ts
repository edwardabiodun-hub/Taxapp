import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";
import { createLaunchNotifierHandler } from "./handler.ts";
import { createResendWaitlistSender } from "./email.ts";

type DenoRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const runtime = (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno;

if (runtime) {
  const names = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "LAUNCH_NOTIFICATION_SECRET",
    "LAUNCH_RESEND_API_KEY",
    "LAUNCH_EMAIL_FROM",
    "APP_ORIGIN",
  ] as const;
  const values = Object.fromEntries(names.map((name) => [name, runtime.env.get(name)?.trim()]));
  if (names.some((name) => !values[name])) throw new Error("Launch notification configuration is incomplete");
  if (values.LAUNCH_NOTIFICATION_SECRET!.length < 32) {
    throw new Error("LAUNCH_NOTIFICATION_SECRET must be at least 32 characters");
  }

  const database = createClient(values.SUPABASE_URL!, values.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sendEmail = createResendWaitlistSender({
    apiKey: values.LAUNCH_RESEND_API_KEY!,
    from: values.LAUNCH_EMAIL_FROM!,
    appOrigin: values.APP_ORIGIN!,
  });

  runtime.serve(createLaunchNotifierHandler({
    secret: values.LAUNCH_NOTIFICATION_SECRET!,
    listPending: async (limit) => {
      const { data, error } = await database
        .from("launch_waitlist")
        .select("id,email,name")
        .eq("status", "pending")
        .eq("notification_consent", true)
        .order("created_at", { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    sendEmail,
    markNotified: async (id) => {
      const { data, error } = await database
        .from("launch_waitlist")
        .update({ status: "notified" })
        .eq("id", id)
        .eq("status", "pending")
        .eq("notification_consent", true)
        .select("id")
        .maybeSingle();
      if (error || !data) throw error ?? new Error("Waitlist entry is no longer pending");
    },
  }));
}
