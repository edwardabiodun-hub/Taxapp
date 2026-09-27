import { enforceDualLimit, getTrustedClientIp, type RateLimitClient } from "../_shared/rate-limit.ts";

type AuthResult<T> = {
  data: T | null;
  error: { message?: string } | null;
};

export interface AuthClient {
  auth: {
    signUp: (input: { email: string; password: string }) => Promise<AuthResult<unknown>>;
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

function corsHeaders(origin: string | null, appOrigin: string): HeadersInit {
  if (!origin || origin !== appOrigin) return {};
  return {
    "Access-Control-Allow-Origin": appOrigin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  request: Request,
  appOrigin: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request.headers.get("origin"), appOrigin),
    },
  });
}

function isAllowedRedirect(appOrigin: string, redirectTo: unknown): redirectTo is string {
  if (typeof redirectTo !== "string") return false;
  try {
    const expected = new URL("/reset-password", appOrigin);
    const actual = new URL(redirectTo);
    return actual.origin === expected.origin && actual.pathname === expected.pathname;
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
  return async (request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("origin"), dependencies.appOrigin),
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: { message: "Method not allowed" } }, 405, request, dependencies.appOrigin);
    }

    const operation = operationFromRequest(request);
    if (!operation) {
      return jsonResponse({ error: { message: "Unknown auth operation" } }, 404, request, dependencies.appOrigin);
    }

    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
      body = parsed as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON payload" } }, 400, request, dependencies.appOrigin);
    }

    const email = typeof body.email === "string" ? normalizeEmail(body.email) : undefined;
    const authorization = request.headers.get("authorization") ?? undefined;

    if (operation === "reset" && !isAllowedRedirect(dependencies.appOrigin, body.redirectTo)) {
      return jsonResponse({ error: { message: "Invalid password reset redirect" } }, 400, request, dependencies.appOrigin);
    }

    try {
      if (!dependencies.createAuthClient) {
        throw new Error("Auth client factory is not configured");
      }

      const authClient = dependencies.createAuthClient(authorization);
      let accountKey = email;

      if (operation === "update") {
        if (!authorization?.toLowerCase().startsWith("bearer ")) {
          return jsonResponse({ error: { message: "Auth session missing" } }, 401, request, dependencies.appOrigin);
        }

        const userResult = await authClient.auth.getUser();
        const userId = userResult.data?.user?.id;
        if (userResult.error || !userId) {
          return jsonResponse({ error: { message: "Auth session invalid" } }, 401, request, dependencies.appOrigin);
        }
        accountKey = `user:${userId}`;
      }

      if (!accountKey) {
        return jsonResponse({ error: { message: "Authentication identity missing" } }, 401, request, dependencies.appOrigin);
      }

      const limit = limits[operation];
      const rateLimitResult = await enforceDualLimit(dependencies.rateLimitClient, {
        accountKey,
        ipKey: getTrustedClientIp(request),
        ...limit,
        salt: dependencies.rateLimitSalt,
      });
      if (!rateLimitResult.allowed) {
        return jsonResponse({ error: { message: "Too many attempts. Try again later." } }, 429, request, dependencies.appOrigin);
      }

      let result: AuthResult<unknown>;

      switch (operation) {
        case "signup":
          if (typeof body.password !== "string") throw new Error("Password is required");
          result = await authClient.auth.signUp({ email: email!, password: body.password });
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
        dependencies.appOrigin,
      );
    } catch (error) {
      console.error("[auth-gateway] request failed:", error);
      return jsonResponse({ error: { message: "Authentication service unavailable" } }, 503, request, dependencies.appOrigin);
    }
  };
}
