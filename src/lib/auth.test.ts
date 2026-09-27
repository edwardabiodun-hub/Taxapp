import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  setSession: vi.fn(),
};

const fetchMock = vi.fn();

function gatewayResponse(data: unknown, error: unknown = null, status = 200): Response {
  return new Response(JSON.stringify({ data, error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

vi.mock("./supabase-client", () => ({
  supabase: { auth: authMock },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    authMock.getSession.mockResolvedValue({ data: { session: { access_token: "session-token" } } });
    fetchMock.mockResolvedValue(gatewayResponse({}));
  });

  describe("signUp", () => {
    it("returns success and the new user id when Supabase accepts the signup", async () => {
      fetchMock.mockResolvedValue(
        gatewayResponse({ session: { access_token: "t" }, user: { id: "user-uuid-123" } }),
      );
      const { signUp } = await import("./auth");

      const result = await signUp("Amara@Example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
      expect(result.userId).toBe("user-uuid-123");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/auth-gateway/signup"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "amara@example.com", password: "correct horse battery staple" }),
        }),
      );
    });

    it("reports whether a session was issued immediately vs. email confirmation is pending", async () => {
      fetchMock.mockResolvedValue(gatewayResponse({ session: null }));
      const { signUp } = await import("./auth");

      const result = await signUp("amara@example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
      expect(result.needsEmailConfirmation).toBe(true);
    });

    it("returns the error message when Supabase rejects the signup", async () => {
      fetchMock.mockResolvedValue(
        gatewayResponse(null, { message: "Password should be at least 6 characters" }, 400),
      );
      const { signUp } = await import("./auth");

      const result = await signUp("amara@example.com", "short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password should be at least 6 characters");
    });
  });

  describe("signIn", () => {
    it("returns success on correct credentials", async () => {
      fetchMock.mockResolvedValue(gatewayResponse({ session: { access_token: "t" }, user: { id: "user-1" } }));
      const { signIn } = await import("./auth");

      const result = await signIn("amara@example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/auth-gateway/signin"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("returns an error on incorrect credentials", async () => {
      fetchMock.mockResolvedValue(gatewayResponse(null, { message: "Invalid login credentials" }, 401));
      const { signIn } = await import("./auth");

      const result = await signIn("amara@example.com", "wrong-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid login credentials");
    });
  });

  describe("resendConfirmationEmail", () => {
    it("resends the signup confirmation email", async () => {
      fetchMock.mockResolvedValue(gatewayResponse({}));
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("Amara@Example.com");

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/auth-gateway/resend"),
        expect.objectContaining({
          body: JSON.stringify({ email: "amara@example.com" }),
        }),
      );
    });

    it("returns the error message when Supabase rejects the resend", async () => {
      fetchMock.mockResolvedValue(gatewayResponse(null, { message: "Email rate limit exceeded" }, 429));
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("amara@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("resetPasswordForEmail", () => {
    it("requests a reset email with the given redirect", async () => {
      fetchMock.mockResolvedValue(gatewayResponse({}));
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("Amara@Example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/auth-gateway/reset"),
        expect.objectContaining({
          body: JSON.stringify({
            email: "amara@example.com",
            redirectTo: "https://app.example.com/reset-password",
          }),
        }),
      );
    });

    it("returns the error message when Supabase rejects the request", async () => {
      fetchMock.mockResolvedValue(gatewayResponse(null, { message: "Email rate limit exceeded" }, 429));
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("amara@example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("updatePassword", () => {
    it("updates the current user's password", async () => {
      fetchMock.mockResolvedValue(gatewayResponse({ user: {} }));
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("new correct horse battery staple");

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/auth-gateway/update"),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
          body: JSON.stringify({ password: "new correct horse battery staple" }),
        }),
      );
    });

    it("returns the error message when Supabase rejects the update", async () => {
      fetchMock.mockResolvedValue(gatewayResponse(null, { message: "Auth session missing" }, 401));
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Auth session missing");
    });
  });
});
