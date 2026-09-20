// Supabase connection settings, read once in one place.
//
// The key is the *public* one that is safe in the browser (access is enforced by Row Level
// Security). Newer Supabase projects call it the "publishable key"; older ones call it the
// "anon key". They play the same role, so either variable name works.
//
// Keep each `process.env.NEXT_PUBLIC_*` reference literal — Next.js only inlines them
// into browser code when they are written out in full.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
