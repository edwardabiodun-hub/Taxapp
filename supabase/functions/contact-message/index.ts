import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";
import { enforceDualLimit, type RateLimitClient } from "../_shared/rate-limit.ts";
import { createResendContactSender } from "./email.ts";
import { createContactMessageHandler, selectContactOrigin, type ContactMessageHandlerDependencies } from "./handler.ts";

type DenoRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
const runtime = (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno;

function validateAppOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash
    || url.hostname === "localhost" || url.hostname.endsWith(".localhost")
    || url.hostname === "127.0.0.1" || url.hostname === "[::1]" || url.hostname === "::1") {
    throw new Error("APP_ORIGIN must be a trusted HTTPS origin");
  }
  return url.origin;
}

if (runtime) {
  const names = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RATE_LIMIT_SALT", "APP_ORIGIN", "LAUNCH_RESEND_API_KEY", "LAUNCH_EMAIL_FROM"] as const;
  const values = Object.fromEntries(names.map((name) => [name, runtime.env.get(name)?.trim()]));
  if (names.some((name) => !values[name])) throw new Error("Contact message configuration is incomplete");
  if (values.RATE_LIMIT_SALT!.length < 32) throw new Error("RATE_LIMIT_SALT must be at least 32 characters");

  const database = createClient(values.SUPABASE_URL!, values.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const rateLimitClient: RateLimitClient = { rpc: async (name, args) => await database.rpc(name, args) };
  const dependencies: ContactMessageHandlerDependencies = {
    appOrigin: validateAppOrigin(selectContactOrigin(runtime.env.get("CONTACT_APP_ORIGIN"), values.APP_ORIGIN!)),
    checkRateLimit: async (email, ip) => {
      const result = await enforceDualLimit(rateLimitClient, {
        accountKey: email,
        ipKey: ip,
        accountLimit: 3,
        ipLimit: 10,
        windowSeconds: 3_600,
        salt: values.RATE_LIMIT_SALT!,
      });
      return result.allowed;
    },
    sendEmail: createResendContactSender({ apiKey: values.LAUNCH_RESEND_API_KEY!, from: values.LAUNCH_EMAIL_FROM! }),
  };
  runtime.serve(createContactMessageHandler(dependencies));
}
