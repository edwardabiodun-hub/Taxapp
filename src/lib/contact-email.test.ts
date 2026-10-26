import { describe, expect, it, vi } from "vitest";
import { createResendContactSender } from "../../supabase/functions/contact-message/email";

describe("Resend contact sender", () => {
  it("sends safely escaped message content to the fixed support inbox", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }));
    const send = createResendContactSender({ apiKey: "test-key", from: "FileSmart <support@mail.filesmartnaija.com>", fetcher });

    await send({ name: "<img src=x>", email: "ada@example.com", subject: "Help", message: "Hello <script>alert(1)</script>" });

    const [, request] = fetcher.mock.calls[0];
    const payload = JSON.parse(String(request?.body));
    expect(fetcher.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    expect(payload.to).toEqual(["hello@filesmartnaija.com"]);
    expect(payload.reply_to).toBe("ada@example.com");
    expect(payload.html).toContain("&lt;img src=x&gt;");
    expect(payload.html).not.toContain("<script>");
    expect(payload.subject).toBe("FileSmart website contact: Help");
  });

  it("fails when Resend rejects delivery", async () => {
    const send = createResendContactSender({
      apiKey: "test-key",
      from: "FileSmart <support@mail.filesmartnaija.com>",
      fetcher: async () => new Response(null, { status: 500 }),
    });

    await expect(send({ name: "Ada", email: "ada@example.com", subject: "Help", message: "Hello there, please assist." }))
      .rejects.toThrow("Email provider rejected the contact request");
  });
});
