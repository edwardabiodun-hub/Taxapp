import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";
import { createAuthGatewayHandler } from "./handler.ts";

type DenoRuntime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const runtime = (globalThis as typeof globalThis & { Deno?: DenoRuntime }).Deno;

if (runtime) {
  const supabaseUrl = runtime.env.get("SUPABASE_URL");
  const supabaseAnonKey = runtime.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = runtime.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const rateLimitSalt = runtime.env.get("RATE_LIMIT_SALT");
  const appOrigin = runtime.env.get("APP_ORIGIN") ?? "https://filesmart-demo.netlify.app";

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !rateLimitSalt) {
    throw new Error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, or RATE_LIMIT_SALT");
  }

  const rateLimitClient = createClient(supabaseUrl, serviceRoleKey);
  const handler = createAuthGatewayHandler({
    appOrigin,
    supabaseUrl,
    supabaseAnonKey,
    rateLimitSalt,
    rateLimitClient,
    createAuthClient: (authorization) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: authorization ? { Authorization: authorization } : {},
        },
      }),
  });

  runtime.serve(handler);
}
