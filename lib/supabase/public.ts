import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Cookie-less anon client for the public website. It can only read the
 * `public_schedule` and `public_coaches` views (see supabase/migrations/0002_rls.sql).
 * Responses are cached and revalidated so public pages stay static-friendly.
 * Pass `{ fresh: true }` for uncached calls (e.g. the QR check-in RPCs).
 * Returns null when Supabase env vars aren't configured yet.
 */
export function createPublicClient({ fresh = false }: { fresh?: boolean } = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fresh
          ? fetch(input, { ...init, cache: "no-store" })
          : fetch(input, { ...init, next: { revalidate: 300 } }),
    },
  });
}
