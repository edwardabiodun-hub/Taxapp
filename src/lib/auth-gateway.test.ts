import { describe, expect, it, vi } from "vitest";
import { createAuthGatewayHandler } from "../../supabase/functions/auth-gateway/handler";

function responseData(data: unknown, error: unknown = null) {
  return { data, error };
}

describe("auth gateway", () => {
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
