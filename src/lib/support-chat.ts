export type SupportChatTurn = { role: "user" | "assistant"; content: string };
export type SupportChatResponse = { answer: string; citations: { label: string; url: string }[] };
export type SupportChatErrorCode = "invalid_request" | "offline" | "authentication" | "rate_limit" | "unavailable";

const messages: Record<SupportChatErrorCode, string> = {
  invalid_request: "Enter a question to continue.",
  offline: "You are offline. Connect to the internet and try again.",
  authentication: "Create a free account or sign in to use tax support.",
  rate_limit: "Too many requests. Please try again later.",
  unavailable: "Tax support is unavailable right now. Please try again later or contact human support.",
};

export class SupportChatError extends Error {
  constructor(readonly code: SupportChatErrorCode) {
    super(messages[code]);
    this.name = "SupportChatError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

export function validateSupportChatInput(input: unknown): asserts input is { message: string; history: SupportChatTurn[] } {
  if (!isRecord(input) || !hasExactKeys(input, ["message", "history"])
    || typeof input.message !== "string" || !input.message.trim() || input.message.length > 2_000
    || !Array.isArray(input.history) || input.history.length > 12 || input.history.length % 2 !== 0) {
    throw new SupportChatError("invalid_request");
  }
  for (const [index, turn] of input.history.entries()) {
    if (!isRecord(turn) || !hasExactKeys(turn, ["role", "content"])
      || turn.role !== (index % 2 === 0 ? "user" : "assistant")
      || typeof turn.content !== "string" || !turn.content.trim() || turn.content.length > 2_000) {
      throw new SupportChatError("invalid_request");
    }
  }
}

function safeUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeSupportChatResponse(value: unknown): SupportChatResponse {
  if (!isRecord(value) || typeof value.answer !== "string" || !value.answer.trim() || !Array.isArray(value.citations)) {
    throw new SupportChatError("unavailable");
  }
  const citations = value.citations.flatMap((citation) => {
    if (!isRecord(citation) || !safeUrl(citation.url)) return [];
    const label = typeof citation.title === "string" ? citation.title : citation.label;
    if (typeof label !== "string" || !label.trim()) return [];
    return [{ label: label.trim(), url: citation.url }];
  });
  return { answer: value.answer, citations };
}

export function isSupportChatConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export async function sendSupportChatMessage(input: { message: string; history: SupportChatTurn[] }): Promise<SupportChatResponse> {
  validateSupportChatInput(input);
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new SupportChatError("offline");

  const { supabase } = await import("@/lib/supabase-client");
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new SupportChatError("authentication");

  try {
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { message: input.message, history: input.history },
    });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      throw new SupportChatError(status === 401 ? "authentication" : status === 429 ? "rate_limit" : "unavailable");
    }
    return normalizeSupportChatResponse(data);
  } catch (error) {
    if (error instanceof SupportChatError) throw error;
    throw new SupportChatError(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable");
  }
}
