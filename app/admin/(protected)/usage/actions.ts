"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formatBytes } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";

export type CleanupResult = { error?: string; done?: string } | undefined;

/** Deletes photo files that no participant/coach points at any more, freeing storage. */
export async function cleanOrphanedPhotos(): Promise<CleanupResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("orphaned_photos");
  if (error) return { error: `Could not check for unused photos: ${error.message}` };
  const orphans = (data ?? []) as { bucket_id: "coach-photos" | "participant-photos"; name: string; size: number }[];
  if (orphans.length === 0) return { done: "No unused photos found — nothing to clean up." };

  let freed = 0;
  let removed = 0;
  for (const bucket of ["coach-photos", "participant-photos"] as const) {
    const items = orphans.filter((o) => o.bucket_id === bucket);
    if (items.length === 0) continue;
    const { error: rmError } = await supabase.storage.from(bucket).remove(items.map((o) => o.name));
    if (rmError) return { error: `Could not delete some photos: ${rmError.message}` };
    removed += items.length;
    freed += items.reduce((sum, o) => sum + Number(o.size), 0);
  }

  revalidatePath("/admin/usage");
  return { done: `Removed ${removed} unused ${removed === 1 ? "photo" : "photos"} and freed ${formatBytes(freed)}.` };
}
