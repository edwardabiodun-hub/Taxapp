import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project's values."
  );
}

// persistSession (default true) is what makes offline app-open work: the
// SDK caches the session in localStorage and resolves getSession() from
// that cache without a network round-trip, only hitting the network to
// refresh an expiring token when one is actually reachable.
export const supabase = createClient(url, anonKey);
