import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { checkRoomFor } from "@/lib/limits";

/** Largest file we accept from a browser. It is shrunk before it is stored (see compressPhoto). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Returns an error message if the upload isn't an acceptable photo, else null. */
export function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Photo must be a JPEG, PNG or WebP image.";
  if (file.size > MAX_PHOTO_BYTES) return "Photo must be 5 MB or smaller.";
  return null;
}

/**
 * Shrinks a photo so a whole gym's worth stays tiny: fixes rotation, fits it inside
 * 1024×1024 and re-encodes as WebP. Typically 60–200 KB instead of several MB.
 */
export async function compressPhoto(file: File): Promise<{ data?: Buffer; error?: string }> {
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const data = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return { data };
  } catch {
    return { error: "That file couldn't be read as an image. Try a different photo." };
  }
}

type Bucket = "coach-photos" | "participant-photos";

/**
 * Compresses a photo, checks the size budget, uploads it and returns its object path.
 * Pass the signed-in user's client for staff uploads, or the admin client for a member's
 * own photo (members have no direct storage access).
 */
export async function uploadPhoto(
  supabase: SupabaseClient,
  bucket: Bucket,
  folder: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const compressed = await compressPhoto(file);
  if (compressed.error || !compressed.data) return { error: compressed.error };

  const full = await checkRoomFor(supabase, compressed.data.length);
  if (full) return { error: full };

  const path = `${folder}/${Date.now()}.webp`;
  const { error } = await supabase.storage.from(bucket).upload(path, compressed.data, {
    contentType: "image/webp",
    cacheControl: "3600",
  });
  if (error) return { error: `Photo upload failed: ${error.message}` };
  return { path };
}

export async function removePhoto(
  supabase: SupabaseClient,
  bucket: Bucket,
  path: string | null | undefined,
) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

/** Signed URLs (1 hour) for participant photos, keyed by storage path. */
export async function signParticipantPhotos(
  supabase: SupabaseClient,
  paths: (string | null)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data } = await supabase.storage.from("participant-photos").createSignedUrls(unique, 3600);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
  }
  return map;
}

/** Storage path within the coach-photos bucket for one of our public URLs. */
export function coachPhotoPath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = "/coach-photos/";
  const i = publicUrl.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(publicUrl.slice(i + marker.length).split("?")[0]);
}
