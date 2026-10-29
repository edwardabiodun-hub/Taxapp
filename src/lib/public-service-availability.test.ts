import { beforeEach, describe, expect, it, vi } from "vitest";

const input = {
  email: "ada@example.com",
  name: "Ada Okafor",
  source: "test",
  notificationConsent: true,
};

describe("public service availability", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("./supabase-client", () => {
      throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    });
  });

  it("keeps the waitlist page usable when the backend configuration is unavailable", async () => {
    const { joinLaunchWaitlist, WaitlistError } = await import("./waitlist");

    await expect(joinLaunchWaitlist(input)).rejects.toEqual(expect.any(WaitlistError));
    await expect(joinLaunchWaitlist(input)).rejects.toMatchObject({ code: "unavailable" });
  });

  it("returns the safe contact error when the backend configuration is unavailable", async () => {
    const { submitContactMessage } = await import("./contact");

    await expect(submitContactMessage({
      name: input.name,
      email: input.email,
      subject: "Support",
      message: "Please help.",
    })).rejects.toThrow("We couldn't send your message right now.");
  });
});
