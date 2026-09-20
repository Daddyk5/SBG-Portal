import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The project's size budget: database + stored files together. Default 5 GB; override with
 * DATA_BUDGET_GB. NOTE: your Supabase plan has its own limits (the Free plan is far below
 * 5 GB), so check them too — this is the app's own safety net.
 */
export const DATA_BUDGET_BYTES = Math.round(Number(process.env.DATA_BUDGET_GB ?? 5) * 1024 ** 3);
/** The Usage page turns amber at this share of the budget. */
export const WARN_RATIO = 0.8;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

/**
 * Returns an error message if adding `incomingBytes` would push the project over budget,
 * otherwise null. If usage can't be measured (e.g. migration 0004 not applied yet) it
 * allows the upload rather than blocking the gym, and says so in the server log.
 */
export async function checkRoomFor(supabase: SupabaseClient, incomingBytes: number): Promise<string | null> {
  const { data, error } = await supabase.rpc("usage_bytes");
  if (error || typeof data !== "number") {
    console.warn("usage_bytes() unavailable, skipping size check:", error?.message);
    return null;
  }
  if (data + incomingBytes > DATA_BUDGET_BYTES) {
    return `Storage is full (${formatBytes(data)} of ${formatBytes(DATA_BUDGET_BYTES)} used). Ask an admin to free up space on the Usage page.`;
  }
  return null;
}
