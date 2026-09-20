import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Supabase client with the SECRET key (bypasses Row Level Security).
 *
 * Used ONLY inside Server Actions, and only AFTER the caller has been verified
 * (requireStaff / requireAdmin / requireMember). It is needed for the things a normal
 * signed-in user cannot do: creating login accounts, resetting other people's passwords,
 * and storing a member's own photo. `server-only` makes the build fail if this file is
 * ever imported into browser code, and the key is read from a non-NEXT_PUBLIC variable
 * so it is never sent to the browser.
 */
export function isAdminClientConfigured(): boolean {
  return Boolean(SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("SUPABASE_SECRET_KEY is not set. Add it to .env.local (server-side only).");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const NOT_CONFIGURED_MESSAGE =
  "Account tools aren't set up yet: add SUPABASE_SECRET_KEY to the server environment (see docs/accounts-and-sms.md).";
