import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
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
});
