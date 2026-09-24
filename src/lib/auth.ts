import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

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

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, needsEmailConfirmation: data.session === null, userId: data.user?.id };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
