"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { BELTS, PROGRAMS, STATUSES, gymToday, isBelt, isProgram } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { removePhoto, uploadPhoto, validatePhoto } from "@/lib/storage";

export type FormState = { error?: string; ok?: string } | undefined;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const optional = (formData: FormData, key: string) => text(formData, key) || null;
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function parseParticipant(formData: FormData) {
  const full_name = text(formData, "full_name");
  if (!full_name) return { error: "Full name is required." } as const;

  const email = optional(formData, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." } as const;
  }

  const date_joined = text(formData, "date_joined");
  if (!isDate(date_joined)) return { error: "Enter a valid join date." } as const;

  const belt_rank = text(formData, "belt_rank");
  if (!isBelt(belt_rank)) return { error: `Belt must be one of: ${BELTS.join(", ")}.` } as const;

  const stripes = Number(text(formData, "stripes") || 0);
  if (!Number.isInteger(stripes) || stripes < 0 || stripes > 10) {
    return { error: "Stripes must be a whole number from 0 to 10." } as const;
  }

  const program = formData.getAll("program").map(String);
  if (!program.every(isProgram) || program.length > PROGRAMS.length) {
    return { error: "Invalid program selection." } as const;
  }

  const status = text(formData, "status");
  if (!(STATUSES as readonly string[]).includes(status)) {
    return { error: "Invalid status." } as const;
  }

  return {
    value: {
      full_name,
      email,
      phone: optional(formData, "phone"),
      date_joined,
      belt_rank,
      stripes,
      program,
      status,
      notes: optional(formData, "notes"),
    },
  } as const;
}

function photoFile(formData: FormData): File | null {
  const file = formData.get("photo");
  return file instanceof File && file.size > 0 ? file : null;
}

/** Any staff member can add a participant (e.g. a walk-in during check-in). */
export async function createParticipant(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();
  const parsed = parseParticipant(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const id = crypto.randomUUID();
  let photo_url: string | null = null;

  const file = photoFile(formData);
  if (file) {
    const invalid = validatePhoto(file);
    if (invalid) return { error: invalid };
    const upload = await uploadPhoto(supabase, "participant-photos", id, file);
    if (upload.error) return { error: upload.error };
    photo_url = upload.path ?? null;
  }

  const { error } = await supabase.from("participants").insert({ id, ...parsed.value, photo_url });
  if (error) {
    await removePhoto(supabase, "participant-photos", photo_url);
    return { error: `Could not save participant: ${error.message}` };
  }

  revalidatePath("/admin/participants");
  const returnTo = text(formData, "return_to");
  redirect(returnTo.startsWith("/admin/") ? returnTo : `/admin/participants/${id}`);
}

export async function updateParticipant(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseParticipant(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const update: Record<string, unknown> = { ...parsed.value };

  const { data: existing } = await supabase
    .from("participants")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();

  const file = photoFile(formData);
  let newPath: string | null = null;
  if (file) {
    const invalid = validatePhoto(file);
    if (invalid) return { error: invalid };
    const upload = await uploadPhoto(supabase, "participant-photos", id, file);
    if (upload.error) return { error: upload.error };
    newPath = upload.path ?? null;
    update.photo_url = newPath;
  }

  const { error } = await supabase.from("participants").update(update).eq("id", id);
  if (error) {
    await removePhoto(supabase, "participant-photos", newPath);
    return { error: `Could not save participant: ${error.message}` };
  }
  if (newPath) await removePhoto(supabase, "participant-photos", existing?.photo_url);

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${id}`);
  redirect(`/admin/participants/${id}`);
}

export async function logAttendance(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const class_id = text(formData, "class_id");
  const session_date = text(formData, "session_date");
  if (!class_id) return { error: "Choose a class." };
  if (!isDate(session_date)) return { error: "Choose a valid date." };
  if (session_date > gymToday().date) return { error: "Choose today or an earlier date." };

  const supabase = await createClient();
  const { error } = await supabase.from("attendance").upsert(
    { participant_id: participantId, class_id, session_date, checked_in_by: staff.user_id },
    { onConflict: "participant_id,class_id,session_date", ignoreDuplicates: true },
  );
  if (error) return { error: `Could not log attendance: ${error.message}` };

  revalidatePath(`/admin/participants/${participantId}`);
  return { ok: "Attendance logged." };
}

export async function addProgression(
  participantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const staff = await requireStaff();
  const entry_date = text(formData, "entry_date");
  if (!isDate(entry_date)) return { error: "Choose a valid date." };
  if (entry_date > gymToday().date) return { error: "Choose today or an earlier date." };

  const beltRaw = text(formData, "belt_rank");
  if (beltRaw && !isBelt(beltRaw)) return { error: "Invalid belt." };
  const stripesRaw = text(formData, "stripes");
  const stripes = stripesRaw === "" ? null : Number(stripesRaw);
  if (stripes !== null && (!Number.isInteger(stripes) || stripes < 0 || stripes > 10)) {
    return { error: "Stripes must be a whole number from 0 to 10." };
  }
  const note = optional(formData, "note");
  // Only a note can be "sent to the member"; promotions are always visible to them.
  const visible_to_member = Boolean(note) && formData.get("share") === "on";
  if (!beltRaw && stripes === null && !note) {
    return { error: "Add a note, a belt promotion, or a stripe count." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("progression_log").insert({
    participant_id: participantId,
    entry_date,
    belt_rank: beltRaw || null,
    stripes,
    note,
    visible_to_member,
    logged_by: staff.user_id,
  });
  if (error) return { error: `Could not save entry: ${error.message}` };

  revalidatePath(`/admin/participants/${participantId}`);
  revalidatePath("/admin/participants");
  return { ok: visible_to_member ? "Entry added and sent to the member." : "Entry added." };
}
