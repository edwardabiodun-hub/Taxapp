import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface AuthResult {
  success: boolean;
  error?: string;
  /** true when signUp succeeded but Supabase requires email confirmation
   * before issuing a session — the project's "Confirm email" setting is on.
   * The caller should not treat this as fully signed in. */
  needsEmailConfirmation?: boolean;
  /** The Supabase auth user's id (present on a successful signUp). Local
   * records (e.g. the profile) should use this as their id, since the
   * profiles table's primary key references auth.users(id). */
  userId?: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface GatewayResponse<T> {
  data: T | null;
  error?: string;
}

interface AuthGatewayData {
  session?: Session | null;
  user?: { id?: string } | null;
}

async function callAuthGateway<T extends AuthGatewayData | Record<string, unknown>>(
  operation: "signup" | "signin" | "resend" | "reset" | "update",
  body: Record<string, unknown>,
  requiresSession = false,
): Promise<GatewayResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (SUPABASE_ANON_KEY) headers.apikey = SUPABASE_ANON_KEY;

  if (requiresSession) {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) return { data: null, error: "Auth session missing" };
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL ?? ""}/functions/v1/auth-gateway/${operation}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return { data: null, error: "Unable to reach authentication service" };
  }

  let payload: { data?: T | null; error?: { message?: string } | string } | null = null;
  try {
    payload = await response.json();
  } catch {
    return { data: null, error: "Authentication service returned an invalid response" };
  }

  const errorMessage =
    typeof payload?.error === "string"
      ? payload.error
      : payload?.error?.message;
  if (!response.ok || errorMessage) {
    return { data: null, error: errorMessage ?? "Authentication request failed" };
  }

  const data = payload?.data ?? null;
  if (data && "session" in data && data.session) {
    const sessionResult = await supabase.auth.setSession(data.session as { access_token: string; refresh_token: string });
    if (sessionResult?.error) return { data: null, error: sessionResult.error.message };
  }

  return { data, error: undefined };
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const result = await callAuthGateway<AuthGatewayData>("signup", {
    email: normalizeEmail(email),
    password,
  });
  if (result.error) return { success: false, error: result.error };
  return {
    success: true,
    needsEmailConfirmation: result.data?.session === null,
    userId: result.data?.user?.id,
  };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const result = await callAuthGateway<AuthGatewayData>("signin", {
    email: normalizeEmail(email),
    password,
  });
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const result = await callAuthGateway("resend", { email: normalizeEmail(email) });
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

export async function resetPasswordForEmail(email: string, redirectTo: string): Promise<AuthResult> {
  const result = await callAuthGateway("reset", { email: normalizeEmail(email), redirectTo });
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const result = await callAuthGateway("update", { password }, true);
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}
