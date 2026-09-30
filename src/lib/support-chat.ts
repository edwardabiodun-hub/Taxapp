import { supabase } from "@/lib/supabase-client";

export type SupportChatTurn = { role: "user" | "assistant"; content: string };
export type SupportChatResponse = { answer: string; citations: { label: string; url: string }[] };
export type SupportChatErrorCode = "invalid_request" | "offline" | "authentication" | "rate_limit" | "unavailable";

const messages: Record<SupportChatErrorCode, string> = {
  invalid_request: "Enter a question to continue.",
  offline: "You are offline. Connect to the internet and try again.",
  authentication: "Your session has expired. Sign in again to use tax support.",
  rate_limit: "Too many requests. Please try again later.",
  unavailable: "Tax support is unavailable right now. Please try again later or contact human support.",
};

export class SupportChatError extends Error {
  constructor(public readonly code: SupportChatErrorCode) {
    super(messages[code]);
    this.name = "SupportChatError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function safeUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function normalizeResponse(value: unknown): SupportChatResponse {
  if (!isRecord(value) || typeof value.answer !== "string" || !value.answer.trim() || !Array.isArray(value.citations)) {
    throw new SupportChatError("unavailable");
  }
  const citations = value.citations.slice(0, 5).flatMap((entry): SupportChatResponse["citations"] => {
    if (!isRecord(entry) || !safeUrl(entry.url)) return [];
    const label = typeof entry.title === "string" ? entry.title : entry.label;
    return typeof label === "string" && label.trim() ? [{ label: label.trim(), url: entry.url }] : [];
  });
  return { answer: value.answer, citations };
}

export async function sendSupportChatMessage(input: { message: string; history: SupportChatTurn[] }): Promise<SupportChatResponse> {
  if (!isRecord(input) || !hasExactKeys(input, ["message", "history"])
    || typeof input.message !== "string" || !input.message.trim() || input.message.length > 2_000
    || !Array.isArray(input.history) || input.history.length > 12 || input.history.length % 2 !== 0) {
    throw new SupportChatError("invalid_request");
  }
  const history: SupportChatTurn[] = [];
  for (const [index, turn] of input.history.entries()) {
    if (!isRecord(turn) || !hasExactKeys(turn, ["role", "content"])
      || turn.role !== (index % 2 === 0 ? "user" : "assistant")
      || typeof turn.content !== "string" || !turn.content.trim() || turn.content.length > 2_000) {
      throw new SupportChatError("invalid_request");
    }
    history.push({ role: turn.role as SupportChatTurn["role"], content: turn.content });
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new SupportChatError("offline");

  try {
    const { data, error } = await supabase.functions.invoke("support-chat", {
      body: { message: input.message, history },
    });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      throw new SupportChatError(status === 401 ? "authentication" : status === 429 ? "rate_limit" : "unavailable");
    }
    return normalizeResponse(data);
  } catch (error) {
    if (error instanceof SupportChatError) throw error;
    throw new SupportChatError(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "unavailable");
  }
}
