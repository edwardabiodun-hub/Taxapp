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
};

vi.mock("./supabase-client", () => ({
  supabase: { auth: authMock },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("returns success and the new user id when Supabase accepts the signup", async () => {
      authMock.signUp.mockResolvedValue({
        data: { session: { access_token: "t" }, user: { id: "user-uuid-123" } },
        error: null,
      });
      const { signUp } = await import("./auth");

      const result = await signUp("Amara@Example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
      expect(result.userId).toBe("user-uuid-123");
      expect(authMock.signUp).toHaveBeenCalledWith({
        email: "amara@example.com",
        password: "correct horse battery staple",
      });
    });

    it("reports whether a session was issued immediately vs. email confirmation is pending", async () => {
      authMock.signUp.mockResolvedValue({ data: { session: null }, error: null });
      const { signUp } = await import("./auth");

      const result = await signUp("amara@example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
      expect(result.needsEmailConfirmation).toBe(true);
    });

    it("returns the error message when Supabase rejects the signup", async () => {
      authMock.signUp.mockResolvedValue({
        data: { session: null },
        error: { message: "Password should be at least 6 characters" },
      });
      const { signUp } = await import("./auth");

      const result = await signUp("amara@example.com", "short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password should be at least 6 characters");
    });
  });

  describe("signIn", () => {
    it("returns success on correct credentials", async () => {
      authMock.signInWithPassword.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
      const { signIn } = await import("./auth");

      const result = await signIn("amara@example.com", "correct horse battery staple");

      expect(result.success).toBe(true);
    });

    it("returns an error on incorrect credentials", async () => {
      authMock.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: "Invalid login credentials" },
      });
      const { signIn } = await import("./auth");

      const result = await signIn("amara@example.com", "wrong-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid login credentials");
    });
  });

  describe("resendConfirmationEmail", () => {
    it("resends the signup confirmation email", async () => {
      authMock.resend.mockResolvedValue({ error: null });
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("Amara@Example.com");

      expect(result.success).toBe(true);
      expect(authMock.resend).toHaveBeenCalledWith({ type: "signup", email: "amara@example.com" });
    });

    it("returns the error message when Supabase rejects the resend", async () => {
      authMock.resend.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
      const { resendConfirmationEmail } = await import("./auth");

      const result = await resendConfirmationEmail("amara@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("resetPasswordForEmail", () => {
    it("requests a reset email with the given redirect", async () => {
      authMock.resetPasswordForEmail.mockResolvedValue({ error: null });
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("Amara@Example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(true);
      expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith("amara@example.com", {
        redirectTo: "https://app.example.com/reset-password",
      });
    });

    it("returns the error message when Supabase rejects the request", async () => {
      authMock.resetPasswordForEmail.mockResolvedValue({ error: { message: "Email rate limit exceeded" } });
      const { resetPasswordForEmail } = await import("./auth");

      const result = await resetPasswordForEmail("amara@example.com", "https://app.example.com/reset-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email rate limit exceeded");
    });
  });

  describe("updatePassword", () => {
    it("updates the current user's password", async () => {
      authMock.updateUser.mockResolvedValue({ data: { user: {} }, error: null });
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("new correct horse battery staple");

      expect(result.success).toBe(true);
      expect(authMock.updateUser).toHaveBeenCalledWith({ password: "new correct horse battery staple" });
    });

    it("returns the error message when Supabase rejects the update", async () => {
      authMock.updateUser.mockResolvedValue({ data: { user: null }, error: { message: "Auth session missing" } });
      const { updatePassword } = await import("./auth");

      const result = await updatePassword("short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Auth session missing");
    });
  });
});
