import { createClient } from "@supabase/supabase-js";
import { createAuthGatewayHandler, validateAppOrigin } from "./handler.ts";

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
  const configuredAppOrigin = runtime.env.get("APP_ORIGIN");
  const environment = runtime.env.get("ENVIRONMENT") ?? "production";
  const allowLocalDevelopment =
    environment !== "production" && runtime.env.get("ALLOW_LOCAL_ORIGIN") === "true";

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !rateLimitSalt || !configuredAppOrigin) {
    throw new Error(
      "Missing SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, RATE_LIMIT_SALT, or APP_ORIGIN",
    );
  }

  const appOrigin = validateAppOrigin(configuredAppOrigin, { allowLocalDevelopment });

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
