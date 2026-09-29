import { describe, expect, it, vi } from "vitest";
import { createAuthGatewayHandler, validateAppOrigin } from "../../supabase/functions/auth-gateway/handler";

function responseData(data: unknown, error: unknown = null) {
  return { data, error };
}

describe("auth gateway", () => {
  it("accepts only secure, canonical production origins", () => {
    expect(validateAppOrigin("https://app.example.com")).toBe("https://app.example.com");
    expect(() => validateAppOrigin("http://app.example.com")).toThrow();
    expect(() => validateAppOrigin("http://localhost:8080")).toThrow();
    expect(() => validateAppOrigin("https://app.example.com/login")).toThrow();
    expect(() => validateAppOrigin("https://user:pass@app.example.com")).toThrow();
  });

  it("returns narrowly scoped CORS headers for an allowed preflight", async () => {
    const handler = createAuthGatewayHandler({
      appOrigin: "https://app.example.com",
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "anon-key",
      rateLimitSalt: "test-salt",
      rateLimitClient: { rpc: vi.fn() },
    });

    const response = await handler(
      new Request("https://project.supabase.co/functions/v1/auth-gateway/signin", {
        method: "OPTIONS",
        headers: {
          origin: "https://app.example.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type, authorization",
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("authorization, apikey, content-type");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each(["https://attacker.example", "https://app.example.com.attacker.example", "null", "http://localhost:8080"])(
    "rejects untrusted preflight origin %s",
    async (origin) => {
      const handler = createAuthGatewayHandler({
        appOrigin: "https://app.example.com",
        supabaseUrl: "https://project.supabase.co",
        supabaseAnonKey: "anon-key",
        rateLimitSalt: "test-salt",
        rateLimitClient: { rpc: vi.fn() },
      });

      const response = await handler(
        new Request("https://project.supabase.co/functions/v1/auth-gateway/signin", {
          method: "OPTIONS",
          headers: {
            origin,
            "access-control-request-method": "POST",
          },
        }),
      );

      expect(response.status).toBe(403);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    },
  );

  it.each([
    ["GET", "content-type"],
    ["POST", "x-custom-header"],
  ])("rejects unsupported preflight method/header combinations", async (method, headers) => {
    const handler = createAuthGatewayHandler({
      appOrigin: "https://app.example.com",
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "anon-key",
      rateLimitSalt: "test-salt",
      rateLimitClient: { rpc: vi.fn() },
    });

    const response = await handler(
      new Request("https://project.supabase.co/functions/v1/auth-gateway/signin", {
        method: "OPTIONS",
        headers: {
          origin: "https://app.example.com",
          "access-control-request-method": method,
          "access-control-request-headers": headers,
        },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("denies a request when either account or IP budget is exhausted", async () => {
    const authClient = {
      auth: { signInWithPassword: vi.fn(), getUser: vi.fn() },
    };
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    const handler = createAuthGatewayHandler({
      appOrigin: "https://app.example.com",
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "anon-key",
      rateLimitSalt: "test-salt",
      rateLimitClient: { rpc },
      createAuthClient: () => authClient,
    });

    const response = await handler(
      new Request("https://project.supabase.co/functions/v1/auth-gateway/signin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.7",
          origin: "https://app.example.com",
        },
        body: JSON.stringify({ email: "amara@example.com", password: "wrong" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(authClient.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("forwards sign-in only after both budgets allow it", async () => {
    const authClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue(
          responseData({ session: { access_token: "token" }, user: { id: "user-1" } }),
        ),
        getUser: vi.fn(),
      },
    };
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const handler = createAuthGatewayHandler({
      appOrigin: "https://app.example.com",
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "anon-key",
      rateLimitSalt: "test-salt",
      rateLimitClient: { rpc },
      createAuthClient: () => authClient,
    });

    const response = await handler(
      new Request("https://project.supabase.co/functions/v1/auth-gateway/signin", {
        method: "POST",
        body: JSON.stringify({ email: "Amara@Example.com", password: "secret" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(authClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "amara@example.com",
      password: "secret",
    });
  });

  it("uses the verified user id for the account limiter on password updates", async () => {
    const authClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue(responseData({ user: { id: "user-42" } })),
        updateUser: vi.fn().mockResolvedValue(responseData({ user: { id: "user-42" } })),
      },
    };
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    const handler = createAuthGatewayHandler({
      appOrigin: "https://app.example.com",
      supabaseUrl: "https://project.supabase.co",
      supabaseAnonKey: "anon-key",
      rateLimitSalt: "test-salt",
      rateLimitClient: { rpc },
      createAuthClient: () => authClient,
    });

    const response = await handler(
      new Request("https://project.supabase.co/functions/v1/auth-gateway/update", {
        method: "POST",
        headers: {
          authorization: "Bearer session-token",
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.7",
        },
        body: JSON.stringify({ password: "new-password" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authClient.auth.getUser).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(authClient.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
  });
});
