import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.1";

type Runtime = {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const runtime = (globalThis as typeof globalThis & { Deno?: Runtime }).Deno;

function validateOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash
    || url.hostname === "localhost" || url.hostname.endsWith(".localhost")
    || url.hostname === "127.0.0.1" || url.hostname === "[::1]" || url.hostname === "::1") {
    throw new Error("Origins must be trusted HTTPS origins");
  }
  return url.origin;
}

function response(status: number, body: Record<string, unknown>, origin?: string): Response {
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    vary: "Origin",
  });
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "authorization, apikey, content-type, x-client-info");
    headers.set("access-control-max-age", "600");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

if (runtime) {
  const url = runtime.env.get("SUPABASE_URL")?.trim();
  const anonKey = runtime.env.get("SUPABASE_ANON_KEY")?.trim();
  const primaryOrigin = runtime.env.get("APP_ORIGIN")?.trim();
  const additionalOrigins = (runtime.env.get("AUTH_APP_ORIGINS") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!url || !anonKey || !primaryOrigin) throw new Error("Pricing catalog configuration is incomplete");
  const allowedOrigins = new Set([primaryOrigin, ...additionalOrigins].map(validateOrigin));

  runtime.serve(async (request) => {
    const requestOrigin = request.headers.get("origin");
    const allowedOrigin = requestOrigin && requestOrigin !== "null" && allowedOrigins.has(requestOrigin) ? requestOrigin : undefined;
    if (request.method === "OPTIONS") {
      if (!allowedOrigin || request.headers.get("access-control-request-method") !== "POST") return response(403, { error: "forbidden" });
      const requestedHeaders = (request.headers.get("access-control-request-headers") ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
      const permittedHeaders = new Set(["authorization", "apikey", "content-type", "x-client-info"]);
      if (requestedHeaders.some((item) => !permittedHeaders.has(item))) return response(403, { error: "forbidden" });
      return response(204, {}, allowedOrigin);
    }
    if (!allowedOrigin) return response(403, { error: "forbidden" });
    if (request.method !== "POST") return response(405, { error: "method_not_allowed" }, allowedOrigin);

    const authorization = request.headers.get("authorization");
    if (!authorization?.toLowerCase().startsWith("bearer ")) return response(401, { error: "authentication_required" }, allowedOrigin);
    const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return response(401, { error: "authentication_required" }, allowedOrigin);

    return response(200, {
      plans: [
        { name: "Basic", range: "Below ₦2,000,000 annual gross income", price: "₦0", description: "A free starting point for straightforward individual preparation.", features: ["Guided tax preparation", "Tax estimation tools", "Education and general support"] },
        { name: "Silver", range: "₦2,000,000 to below ₦5,000,000", price: "₦5,000", description: "Planned support for taxpayers with more income to organise and review.", features: ["Everything in Basic", "Expanded preparation support", "Review-ready income summary"] },
        { name: "Premium", range: "₦5,000,000 to ₦10,000,000", price: "₦10,000", description: "Planned support for higher-income preparation and more involved records.", features: ["Everything in Silver", "More detailed preparation guidance", "Priority launch information"] },
        { name: "Premium Plus", range: "Above ₦10,000,000", price: "From ₦15,000", description: "Planned pricing for higher-income or more complex preparation needs.", features: ["Everything in Premium", "Complexity-based pricing", "Human-support pathway"] },
      ],
    }, allowedOrigin);
  });
}
