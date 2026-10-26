import { enforceDualLimit, getTrustedClientIp, type RateLimitClient } from "../_shared/rate-limit.ts";

type AuthResult<T> = {
  data: T | null;
  error: { message?: string } | null;
};

export interface AuthClient {
  auth: {
    signUp: (input: { email: string; password: string; options?: { emailRedirectTo: string } }) => Promise<AuthResult<unknown>>;
    signInWithPassword: (input: { email: string; password: string }) => Promise<AuthResult<unknown>>;
    resend: (input: { type: "signup"; email: string }) => Promise<AuthResult<unknown>>;
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<AuthResult<unknown>>;
    getUser: () => Promise<AuthResult<{ user?: { id?: string } }>>;
    updateUser: (input: { password: string }) => Promise<AuthResult<unknown>>;
  };
}

export interface AuthGatewayDependencies {
  appOrigin: string;
  additionalAppOrigins?: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  rateLimitSalt: string;
  rateLimitClient: RateLimitClient;
  createAuthClient?: (authorization?: string) => AuthClient;
}

const limits = {
  signup: { accountLimit: 3, ipLimit: 10, windowSeconds: 3600 },
  signin: { accountLimit: 5, ipLimit: 30, windowSeconds: 900 },
  resend: { accountLimit: 3, ipLimit: 10, windowSeconds: 900 },
  reset: { accountLimit: 3, ipLimit: 10, windowSeconds: 900 },
  update: { accountLimit: 5, ipLimit: 20, windowSeconds: 900 },
} as const;

type Operation = keyof typeof limits;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const allowedCorsHeaders = new Set(["authorization", "apikey", "content-type"]);

export interface AppOriginValidationOptions {
  allowLocalDevelopment?: boolean;
}

export function validateAppOrigin(
  value: string,
  options: AppOriginValidationOptions = {},
): string {
  const url = new URL(value);
  const isLocalHost =
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]" ||
    url.hostname === "::1";
  const isAllowedLocalDevelopment = options.allowLocalDevelopment && isLocalHost;

  if (
    (url.protocol !== "https:" && !isAllowedLocalDevelopment) ||
    (!isAllowedLocalDevelopment && isLocalHost) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("APP_ORIGIN must be a trusted HTTPS origin");
  }

  return url.origin;
}

function isAllowedOrigin(origin: string | null, appOrigins: ReadonlySet<string>): boolean {
  return Boolean(origin && origin !== "null" && appOrigins.has(origin));
}

function isAllowedPreflight(request: Request, appOrigins: ReadonlySet<string>): boolean {
  if (!isAllowedOrigin(request.headers.get("origin"), appOrigins)) return false;

  const requestedMethod = request.headers.get("access-control-request-method");
  if (requestedMethod && requestedMethod !== "POST") return false;

  const requestedHeaders = request.headers.get("access-control-request-headers");
  if (!requestedHeaders) return true;

  return requestedHeaders
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean)
    .every((header) => allowedCorsHeaders.has(header));
}

function corsHeaders(origin: string | null, appOrigins: ReadonlySet<string>): HeadersInit {
  if (!isAllowedOrigin(origin, appOrigins)) return {};
  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  request: Request,
  appOrigins: ReadonlySet<string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(request.headers.get("origin"), appOrigins),
    },
  });
}

function isAllowedRedirect(appOrigins: ReadonlySet<string>, redirectTo: unknown, allowedPath: string): redirectTo is string {
  if (typeof redirectTo !== "string") return false;
  try {
    const actual = new URL(redirectTo);
    return appOrigins.has(actual.origin) && !actual.username && !actual.password
      && actual.pathname === allowedPath && !actual.search && !actual.hash;
  } catch {
    return false;
  }
}

function operationFromRequest(request: Request): Operation | null {
  const operation = new URL(request.url).pathname.split("/").filter(Boolean).pop();
  return operation && operation in limits ? (operation as Operation) : null;
}

export function createAuthGatewayHandler(
  dependencies: AuthGatewayDependencies,
): (request: Request) => Promise<Response> {
  const appOrigins = new Set([dependencies.appOrigin, ...(dependencies.additionalAppOrigins ?? [])].map((origin) => validateAppOrigin(origin)));

  return async (request) => {
    if (request.method === "OPTIONS") {
      if (!isAllowedPreflight(request, appOrigins)) {
        return new Response(null, {
          status: 403,
          headers: { "Cache-Control": "no-store", Vary: "Origin" },
        });
      }

      return new Response(null, {
        status: 204,
        headers: {
          "Cache-Control": "no-store",
          ...corsHeaders(request.headers.get("origin"), appOrigins),
        },
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: { message: "Method not allowed" } }, 405, request, appOrigins);
    }

    const operation = operationFromRequest(request);
    if (!operation) {
      return jsonResponse({ error: { message: "Unknown auth operation" } }, 404, request, appOrigins);
    }

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
      body = parsed as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON payload" } }, 400, request, appOrigins);
    }

    const email = typeof body.email === "string" ? normalizeEmail(body.email) : undefined;
    const authorization = request.headers.get("authorization") ?? undefined;

    if (operation === "reset" && !isAllowedRedirect(appOrigins, body.redirectTo, "/reset-password")) {
      return jsonResponse({ error: { message: "Invalid password reset redirect" } }, 400, request, appOrigins);
    }
    if (operation === "signup" && body.redirectTo !== undefined && !isAllowedRedirect(appOrigins, body.redirectTo, "/")) {
      return jsonResponse({ error: { message: "Invalid account confirmation redirect" } }, 400, request, appOrigins);
    }

    try {
      if (!dependencies.createAuthClient) {
        throw new Error("Auth client factory is not configured");
      }

      const authClient = dependencies.createAuthClient(authorization);
      let accountKey = email;

      if (operation === "update") {
        if (!authorization?.toLowerCase().startsWith("bearer ")) {
          return jsonResponse({ error: { message: "Auth session missing" } }, 401, request, appOrigins);
        }

        const userResult = await authClient.auth.getUser();
        const userId = userResult.data?.user?.id;
        if (userResult.error || !userId) {
          return jsonResponse({ error: { message: "Auth session invalid" } }, 401, request, appOrigins);
        }
        accountKey = `user:${userId}`;
      }

      if (!accountKey) {
        return jsonResponse({ error: { message: "Authentication identity missing" } }, 401, request, appOrigins);
      }

      const limit = limits[operation];
      const rateLimitResult = await enforceDualLimit(dependencies.rateLimitClient, {
        accountKey,
        ipKey: getTrustedClientIp(request),
        ...limit,
        salt: dependencies.rateLimitSalt,
      });
      if (!rateLimitResult.allowed) {
        return jsonResponse({ error: { message: "Too many attempts. Try again later." } }, 429, request, appOrigins);
      }

      let result: AuthResult<unknown>;

      switch (operation) {
        case "signup":
          if (typeof body.password !== "string") throw new Error("Password is required");
          result = await authClient.auth.signUp({
            email: email!,
            password: body.password,
            ...(typeof body.redirectTo === "string" ? { options: { emailRedirectTo: body.redirectTo } } : {}),
          });
          break;
        case "signin":
          if (typeof body.password !== "string") throw new Error("Password is required");
          result = await authClient.auth.signInWithPassword({ email: email!, password: body.password });
          break;
        case "resend":
          result = await authClient.auth.resend({ type: "signup", email: email! });
          break;
        case "reset":
          result = await authClient.auth.resetPasswordForEmail(email!, { redirectTo: body.redirectTo as string });
          break;
        case "update":
          if (typeof body.password !== "string") throw new Error("Password is required");
          result = await authClient.auth.updateUser({ password: body.password });
          break;
      }

      return jsonResponse(
        { data: result.data, error: result.error ? { message: result.error.message } : null },
        result.error ? 400 : 200,
        request,
        appOrigins,
      );
    } catch (error) {
      console.error("[auth-gateway] request failed:", error);
      return jsonResponse({ error: { message: "Authentication service unavailable" } }, 503, request, appOrigins);
    }
  };
}
