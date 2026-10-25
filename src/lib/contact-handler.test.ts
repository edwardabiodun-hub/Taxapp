import { describe, expect, it, vi } from "vitest";
import { createContactMessageHandler, selectContactOrigin } from "../../supabase/functions/contact-message/handler";

const appOrigin = "https://filesmartnaija.com";
const validMessage = {
  name: "Ada Okafor",
  email: "ada@example.com",
  subject: "Account question",
  message: "I need help understanding how to get started.",
  website: "",
};

function createHandler(overrides: Partial<Parameters<typeof createContactMessageHandler>[0]> = {}) {
  return createContactMessageHandler({
    appOrigin,
    checkRateLimit: async () => true,
    sendEmail: async () => undefined,
    ...overrides,
  });
}

function post(body: unknown, origin = appOrigin) {
  return new Request("https://project.supabase.co/functions/v1/contact-message", {
    method: "POST",
    headers: { origin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.8" },
    body: JSON.stringify(body),
  });
}

describe("contact message handler", () => {
  it("uses a dedicated public-site origin without changing the app's existing origin", () => {
    expect(selectContactOrigin("https://www.filesmartnaija.com", "https://filesmart-demo.netlify.app"))
      .toBe("https://www.filesmartnaija.com");
    expect(selectContactOrigin(undefined, "https://filesmart-demo.netlify.app"))
      .toBe("https://filesmart-demo.netlify.app");
  });
  it("emails a valid inquiry without returning its contents", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const checkRateLimit = vi.fn(async () => true);
    const response = await createHandler({ sendEmail, checkRateLimit })(post(validMessage));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendEmail).toHaveBeenCalledWith({
      name: "Ada Okafor",
      email: "ada@example.com",
      subject: "Account question",
      message: "I need help understanding how to get started.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith("ada@example.com", "203.0.113.8");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects untrusted origins without sending or consuming a limit", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const checkRateLimit = vi.fn(async () => true);
    const response = await createHandler({ sendEmail, checkRateLimit })(post(validMessage, "https://attacker.example"));

    expect(response.status).toBe(403);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("allows only the app origin and required headers during preflight", async () => {
    const handler = createHandler();
    const allowed = await handler(new Request("https://project.supabase.co/functions/v1/contact-message", {
      method: "OPTIONS",
      headers: {
        origin: appOrigin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "authorization, apikey, content-type, x-client-info",
      },
    }));
    const denied = await handler(new Request("https://project.supabase.co/functions/v1/contact-message", {
      method: "OPTIONS",
      headers: {
        origin: appOrigin,
        "access-control-request-method": "PUT",
        "access-control-request-headers": "authorization, x-secret-header",
      },
    }));

    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(appOrigin);
    expect(allowed.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
    expect(denied.status).toBe(403);
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects malformed submissions and does not send them", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const response = await createHandler({ sendEmail })(post({ ...validMessage, email: "not-an-email" }));

    expect(response.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("silently accepts a filled honeypot without sending email", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const checkRateLimit = vi.fn(async () => true);
    const response = await createHandler({ sendEmail, checkRateLimit })(post({ ...validMessage, website: "spam link" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns too many requests when the rate limit is exceeded", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const response = await createHandler({ sendEmail, checkRateLimit: async () => false })(post(validMessage));

    expect(response.status).toBe(429);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("fails closed when the rate-limit service is unavailable", async () => {
    const sendEmail = vi.fn(async () => undefined);
    const response = await createHandler({
      sendEmail,
      checkRateLimit: async () => { throw new Error("database unavailable"); },
    })(post(validMessage));

    expect(response.status).toBe(503);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
