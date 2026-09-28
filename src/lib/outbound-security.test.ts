import { describe, expect, it, vi } from "vitest";
import {
  buildMessagesUrl,
  postToResend,
  readResponseBodyLimited,
  validateAppUrl,
} from "../../supabase/functions/send-message-email/outbound";

describe("outbound request hardening", () => {
  it("accepts only an HTTPS origin for the app URL", () => {
    expect(validateAppUrl("https://filesmart.example.com")).toBe("https://filesmart.example.com");
    expect(() => validateAppUrl("http://filesmart.example.com")).toThrow();
    expect(() => validateAppUrl("https://filesmart.example.com/messages")).toThrow();
    expect(() => validateAppUrl("https://filesmart.example.com/?next=https://evil.example")).toThrow();
  });

  it("escapes the configured app URL before inserting it into email HTML", () => {
    expect(buildMessagesUrl("https://filesmart.example.com")).toBe(
      "https://filesmart.example.com/messages",
    );
  });

  it("uses the fixed Resend destination, rejects redirects, and supplies a timeout", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));

    await postToResend(
      { Authorization: "Bearer test", "Content-Type": "application/json" },
      "{}",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("rejects response bodies above the configured limit", async () => {
    const response = new Response("0123456789", {
      headers: { "content-length": "10" },
    });

    await expect(readResponseBodyLimited(response, 9)).rejects.toThrow("response body exceeds limit");
  });

  it("reads response bodies within the configured limit", async () => {
    const response = new Response("ok");

    await expect(readResponseBodyLimited(response, 2)).resolves.toBe("ok");
  });

  it("times out a stalled response body", async () => {
    vi.useFakeTimers();
    try {
      const response = new Response(
        new ReadableStream({
          pull: () => new Promise<void>(() => undefined),
        }),
      );
      const pending = readResponseBodyLimited(response, 1024, 10);
      const assertion = expect(pending).rejects.toThrow("response body timed out");

      await vi.advanceTimersByTimeAsync(10);

      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
