"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/member-auth";
import { normalizePhone } from "@/lib/phone";
import { removePhoto, uploadPhoto, validatePhoto } from "@/lib/storage";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; ok?: string } | undefined;

const THEMES = ["system", "light", "dark"];
const ACCENTS = ["red", "blue", "mono"];

export async function saveProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  await requireMember();

  const nickname = String(formData.get("nickname") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const theme = String(formData.get("theme") ?? "system");
  const accent = String(formData.get("accent") ?? "red");

  if (nickname.length > 40) return { error: "Nickname can be up to 40 characters." };
  if (bio.length > 500) return { error: "About me can be up to 500 characters." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!THEMES.includes(theme) || !ACCENTS.includes(accent)) return { error: "Invalid appearance choice." };

  let phone = "";
  if (phoneRaw) {
    const n = normalizePhone(phoneRaw);
    if (!n.e164) return { error: n.error };
    phone = n.e164;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_nickname: nickname,
    p_bio: bio,
    p_phone: phone,
    p_email: email,
    p_theme: theme,
    p_accent: accent,
  });
  if (error) return { error: `Couldn't save: ${error.message}` };

  // The theme lives in the layout, so refresh everything under /member.
  revalidatePath("/member", "layout");
  return { ok: "Saved." };
}

/** Members have no direct storage access, so their own photo is stored by the server after we verify who they are. */
export async function uploadMyPhoto(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const member = await requireMember();
  if (!isAdminClientConfigured()) return { error: "Photo upload isn't available yet. Please ask a coach." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  const invalid = validatePhoto(file);
  if (invalid) return { error: invalid };

  const admin = createAdminClient();
  const upload = await uploadPhoto(admin, "participant-photos", member.participant_id, file);
  if (upload.error || !upload.path) return { error: upload.error };

  const { error } = await admin.from("participants").update({ photo_url: upload.path }).eq("id", member.participant_id);
  if (error) {
    await removePhoto(admin, "participant-photos", upload.path);
    return { error: `Couldn't save your photo: ${error.message}` };
  }
  await removePhoto(admin, "participant-photos", member.photo_path); // one photo per person keeps storage small

  revalidatePath("/member", "layout");
  return { ok: "Photo updated." };
}
