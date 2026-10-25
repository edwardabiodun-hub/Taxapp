import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitContactMessage } from "./contact";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("./supabase-client", () => ({
  supabase: { functions: { invoke } },
}));

describe("submitContactMessage", () => {
  beforeEach(() => invoke.mockReset());

  it("submits the form to the contact-message function", async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null });

    await expect(submitContactMessage({
      name: "Ada Okafor",
      email: "ada@example.com",
      subject: "Account question",
      message: "I need help understanding how to get started.",
    }, "")).resolves.toBeUndefined();

    expect(invoke).toHaveBeenCalledWith("contact-message", {
      body: {
        name: "Ada Okafor",
        email: "ada@example.com",
        subject: "Account question",
        message: "I need help understanding how to get started.",
        website: "",
      },
    });
  });

  it("returns a safe user-facing error when the function is unavailable", async () => {
    invoke.mockResolvedValue({ data: null, error: new Error("secret internal detail") });

    await expect(submitContactMessage({
      name: "Ada Okafor",
      email: "ada@example.com",
      subject: "Account question",
      message: "I need help understanding how to get started.",
    })).rejects.toThrow("We couldn't send your message right now. Please try again or email hello@filesmartnaija.com.");
  });
});
