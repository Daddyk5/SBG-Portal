"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { coachPhotoPath, removePhoto, uploadPhoto, validatePhoto } from "@/lib/storage";

export type FormState = { error?: string } | undefined;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function parseCoach(formData: FormData) {
  const full_name = text(formData, "full_name");
  if (!full_name) return { error: "Name is required." } as const;
  const sort_order = Number(text(formData, "sort_order") || 0);
  if (!Number.isInteger(sort_order)) return { error: "Order must be a whole number." } as const;
  return {
    value: {
      full_name,
      bio: text(formData, "bio") || null,
      belt_rank: text(formData, "belt_rank") || null,
      sort_order,
    },
  } as const;
}

function refresh() {
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/classes");
  revalidatePath("/coaches");
  revalidatePath("/schedule");
}

async function uploadCoachPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
): Promise<{ url?: string; error?: string }> {
  const invalid = validatePhoto(file);
  if (invalid) return { error: invalid };
  const upload = await uploadPhoto(supabase, "coach-photos", crypto.randomUUID(), file);
  if (upload.error || !upload.path) return { error: upload.error };
  return { url: supabase.storage.from("coach-photos").getPublicUrl(upload.path).data.publicUrl };
}

const photoFile = (formData: FormData) => {
  const file = formData.get("photo");
  return file instanceof File && file.size > 0 ? file : null;
};

export async function createCoach(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCoach(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  let photo_url: string | null = null;
  const file = photoFile(formData);
  if (file) {
    const up = await uploadCoachPhoto(supabase, file);
    if (up.error) return { error: up.error };
    photo_url = up.url ?? null;
  }

  const { error } = await supabase.from("coaches").insert({ ...parsed.value, photo_url });
  if (error) {
    await removePhoto(supabase, "coach-photos", coachPhotoPath(photo_url));
    return { error: `Could not save coach: ${error.message}` };
  }

  refresh();
  redirect("/admin/coaches");
}

export async function updateCoach(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCoach(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("coaches").select("photo_url").eq("id", id).maybeSingle();

  const update: Record<string, unknown> = { ...parsed.value };
  let newUrl: string | null = null;
  const file = photoFile(formData);
  if (file) {
    const up = await uploadCoachPhoto(supabase, file);
    if (up.error) return { error: up.error };
    newUrl = up.url ?? null;
    update.photo_url = newUrl;
  } else if (formData.get("remove_photo") === "on") {
    update.photo_url = null;
  }

  const { error } = await supabase.from("coaches").update(update).eq("id", id);
  if (error) {
    await removePhoto(supabase, "coach-photos", coachPhotoPath(newUrl));
    return { error: `Could not save coach: ${error.message}` };
  }
  if ("photo_url" in update) await removePhoto(supabase, "coach-photos", coachPhotoPath(existing?.photo_url));

  refresh();
  redirect("/admin/coaches");
}

export async function deleteCoach(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing } = await supabase.from("coaches").select("photo_url").eq("id", id).maybeSingle();

  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) return { error: `Could not delete coach: ${error.message}` };
  await removePhoto(supabase, "coach-photos", coachPhotoPath(existing?.photo_url));

  refresh();
  redirect("/admin/coaches");
}
