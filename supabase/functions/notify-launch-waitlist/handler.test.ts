import { describe, expect, it, vi } from "vitest";
import { createLaunchNotifierHandler } from "./handler.ts";
import { createResendWaitlistSender, validateAppOrigin } from "./email.ts";

describe("launch waitlist notification handler", () => {
it("requires the configured bearer secret", async () => {
  const handler = createLaunchNotifierHandler({
    secret: "a-secure-test-secret-with-enough-entropy",
    listPending: async () => [],
    sendEmail: async () => undefined,
    markNotified: async () => undefined,
  });

  const response = await handler(new Request("https://function.test", { method: "POST" }));
  expect(response.status).toBe(401);
});

it("sends only pending records and marks successful deliveries", async () => {
  const sent: string[] = [];
  const marked: string[] = [];
  const handler = createLaunchNotifierHandler({
    secret: "a-secure-test-secret-with-enough-entropy",
    listPending: async (limit) => {
      expect(limit).toBe(2);
      return [
        { id: "entry-1", email: "one@example.com", name: "One" },
        { id: "entry-2", email: "two@example.com", name: null },
      ];
    },
    sendEmail: async (entry) => { sent.push(entry.id); },
    markNotified: async (id) => { marked.push(id); },
  });

  const response = await handler(new Request("https://function.test", {
    method: "POST",
    headers: { authorization: "Bearer a-secure-test-secret-with-enough-entropy", "content-type": "application/json" },
    body: JSON.stringify({ batchSize: 2 }),
  }));

  expect(response.status).toBe(200);
  expect(sent).toEqual(["entry-1", "entry-2"]);
  expect(marked).toEqual(["entry-1", "entry-2"]);
  expect(await response.json()).toEqual({ processed: 2, sent: 2, failed: 0 });
});

it("does not mark an email as notified when delivery fails", async () => {
  const marked: string[] = [];
  const handler = createLaunchNotifierHandler({
    secret: "a-secure-test-secret-with-enough-entropy",
    listPending: async () => [{ id: "entry-1", email: "one@example.com", name: null }],
    sendEmail: async () => { throw new Error("provider failure"); },
    markNotified: async (id) => { marked.push(id); },
  });

  const response = await handler(new Request("https://function.test", {
    method: "POST",
    headers: { authorization: "Bearer a-secure-test-secret-with-enough-entropy" },
  }));

  expect(response.status).toBe(200);
  expect(marked).toEqual([]);
  expect(await response.json()).toEqual({ processed: 1, sent: 0, failed: 1 });
});

it("rejects browser-originated requests and non-POST methods", async () => {
  const handler = createLaunchNotifierHandler({
    secret: "a-secure-test-secret-with-enough-entropy",
    listPending: async () => [],
    sendEmail: async () => undefined,
    markNotified: async () => undefined,
  });

  const getResponse = await handler(new Request("https://function.test", { method: "GET" }));
  const originResponse = await handler(new Request("https://function.test", {
    method: "POST",
    headers: { origin: "https://attacker.example", authorization: "Bearer a-secure-test-secret-with-enough-entropy" },
  }));
  expect(getResponse.status).toBe(405);
  expect(originResponse.status).toBe(403);
});

it("limits each invocation to at most 50 records", async () => {
  const listPending = vi.fn(async () => []);
  const handler = createLaunchNotifierHandler({
    secret: "a-secure-test-secret-with-enough-entropy",
    listPending,
    sendEmail: async () => undefined,
    markNotified: async () => undefined,
  });

  await handler(new Request("https://function.test", {
    method: "POST",
    headers: { authorization: "Bearer a-secure-test-secret-with-enough-entropy", "content-type": "application/json" },
    body: JSON.stringify({ batchSize: 500 }),
  }));
  expect(listPending).toHaveBeenCalledWith(50);
});

it("sends an idempotent plain-text and escaped HTML launch message", async () => {
  const fetcher = vi.fn(async () => new Response(null, { status: 202 }));
  const send = createResendWaitlistSender({
    apiKey: "test-key",
    from: "FileSmart <launch@example.com>",
    appOrigin: "https://filesmart.example",
    fetcher,
  });

  await send({ id: "entry-123", email: "user@example.com", name: "<script>alert(1)</script>" });

  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe("https://api.resend.com/emails");
  expect(new Headers(init?.headers).get("idempotency-key")).toBe("filesmart-launch-entry-123");
  const payload = JSON.parse(String(init?.body));
  expect(payload.to).toEqual(["user@example.com"]);
  expect(payload.html).not.toContain("<script>");
  expect(payload.text).toContain("https://filesmart.example/onboarding");
});

it("rejects non-HTTPS or path-bearing application origins", () => {
  expect(() => validateAppOrigin("http://filesmart.example")).toThrow();
  expect(() => validateAppOrigin("https://filesmart.example/other-path")).toThrow();
});
});
