import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/lib/supabase-client", () => ({ supabase: { functions: { invoke } } }));

import { sendSupportChatMessage, SupportChatError } from "./support-chat";

describe("sendSupportChatMessage", () => {
  beforeEach(() => invoke.mockReset());

  it("sends only the message and paired history to the authenticated function", async () => {
    invoke.mockResolvedValue({ data: { answer: "VAT is a consumption tax.", citations: [{ title: "VAT Act", url: "https://firs.gov.ng/vat", statutoryReference: "section 1" }], profile: { phone: "08012345678" } }, error: null });
    const result = await sendSupportChatMessage({ message: "What is VAT?", history: [] });
    expect(invoke).toHaveBeenCalledWith("support-chat", { body: { message: "What is VAT?", history: [] } });
    expect(result).toEqual({ answer: "VAT is a consumption tax.", citations: [{ label: "VAT Act", url: "https://firs.gov.ng/vat" }] });
  });

  it("rejects empty questions before invocation", async () => {
    await expect(sendSupportChatMessage({ message: "  ", history: [] })).rejects.toMatchObject({ code: "invalid_request" });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("rejects caller-supplied identity and private data instead of forwarding it", async () => {
    const unsafe = { message: "Status?", history: [], userId: "other-user", formData: { income: 500 } };
    await expect(sendSupportChatMessage(unsafe)).rejects.toBeInstanceOf(SupportChatError);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("normalizes provider and authentication errors without exposing server details", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "provider secret sk-test", context: { status: 502 } } });
    await expect(sendSupportChatMessage({ message: "What is VAT?", history: [] })).rejects.toMatchObject({ code: "unavailable", message: expect.not.stringContaining("sk-test") });
    invoke.mockResolvedValue({ data: null, error: { message: "JWT details", context: { status: 401 } } });
    await expect(sendSupportChatMessage({ message: "What is VAT?", history: [] })).rejects.toMatchObject({ code: "authentication" });
  });

  it("rejects malformed answers and unsafe citation links", async () => {
    invoke.mockResolvedValue({ data: { answer: "Safe answer", citations: [{ title: "Bad", url: "javascript:alert(1)" }, { title: "Good", url: "https://firs.gov.ng/vat" }] }, error: null });
    await expect(sendSupportChatMessage({ message: "VAT?", history: [] })).resolves.toEqual({ answer: "Safe answer", citations: [{ label: "Good", url: "https://firs.gov.ng/vat" }] });
    invoke.mockResolvedValue({ data: { answer: { private: "data" }, citations: [] }, error: null });
    await expect(sendSupportChatMessage({ message: "VAT?", history: [] })).rejects.toMatchObject({ code: "unavailable" });
  });
});
