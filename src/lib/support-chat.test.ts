import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke, getSession } = vi.hoisted(() => ({ invoke: vi.fn(), getSession: vi.fn() }));
vi.mock("@/lib/supabase-client", () => ({ supabase: { auth: { getSession }, functions: { invoke } } }));

import { normalizeSupportChatResponse, sendSupportChatMessage, SupportChatError, validateSupportChatInput } from "./support-chat";

describe("support chat client", () => {
  beforeEach(() => {
    invoke.mockReset();
    getSession.mockReset().mockResolvedValue({ data: { session: { access_token: "session-token" } }, error: null });
  });

  it("validates question and alternating history shape", () => {
    expect(() => validateSupportChatInput({
      message: "What is personal income tax?",
      history: [{ role: "user", content: "What is PIT?" }, { role: "assistant", content: "PIT is personal income tax." }],
    })).not.toThrow();
    expect(() => validateSupportChatInput({ message: "", history: [] })).toThrow(/enter a question/i);
    expect(() => validateSupportChatInput({ message: "Status?", history: [], userId: "other-user" })).toThrow();
  });

  it("sends only the question and paired history after checking the caller session", async () => {
    invoke.mockResolvedValue({ data: { answer: "VAT is a consumption tax.", citations: [{ title: "VAT Act", url: "https://firs.gov.ng/vat", statutoryReference: "section 1" }], profile: { phone: "08012345678" } }, error: null });
    const result = await sendSupportChatMessage({ message: "What is VAT?", history: [] });
    expect(getSession).toHaveBeenCalledOnce();
    expect(invoke).toHaveBeenCalledWith("support-chat", { body: { message: "What is VAT?", history: [] } });
    expect(result).toEqual({ answer: "VAT is a consumption tax.", citations: [{ label: "VAT Act", url: "https://firs.gov.ng/vat" }] });
  });

  it("requires a signed-in user and rejects private caller-supplied fields", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(sendSupportChatMessage({ message: "Status?", history: [] })).rejects.toMatchObject({ code: "authentication" });
    const unsafe = { message: "Status?", history: [], userId: "other-user", formData: { income: 500 } };
    await expect(sendSupportChatMessage(unsafe)).rejects.toBeInstanceOf(SupportChatError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("normalizes provider and authentication errors without exposing server details", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "provider secret sk-test", context: { status: 502 } } });
    await expect(sendSupportChatMessage({ message: "What is VAT?", history: [] })).rejects.toMatchObject({ code: "unavailable", message: expect.not.stringContaining("sk-test") });
    invoke.mockResolvedValue({ data: null, error: { message: "JWT details", context: { status: 401 } } });
    await expect(sendSupportChatMessage({ message: "What is VAT?", history: [] })).rejects.toMatchObject({ code: "authentication" });
    invoke.mockResolvedValue({ data: null, error: { message: "quota details", context: { status: 429 } } });
    await expect(sendSupportChatMessage({ message: "What is VAT?", history: [] })).rejects.toMatchObject({ code: "rate_limit", message: expect.not.stringContaining("quota details") });
  });

  it("returns safe HTTPS citations and ignores malformed provider entries", () => {
    expect(normalizeSupportChatResponse({
      answer: "Personal income tax is charged on an individual's taxable income.",
      citations: [
        { title: "FIRS", url: "https://firs.gov.ng" },
        { label: "unsafe", url: "http://example.com" },
        { label: "malformed", url: "not-a-url" },
      ],
    })).toEqual({ answer: "Personal income tax is charged on an individual's taxable income.", citations: [{ label: "FIRS", url: "https://firs.gov.ng" }] });
    expect(() => normalizeSupportChatResponse({ answer: { private: "data" }, citations: [] })).toThrow();
  });
});
