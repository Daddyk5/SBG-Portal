"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isClassProgram } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string } | undefined;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function parseClass(formData: FormData) {
  const name = text(formData, "name");
  if (!name) return { error: "Class name is required." } as const;

  const day_of_week = Number(text(formData, "day_of_week"));
  if (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return { error: "Choose a day of the week." } as const;
  }

  const start_time = text(formData, "start_time");
  const end_time = text(formData, "end_time");
  if (!TIME.test(start_time) || !TIME.test(end_time)) return { error: "Enter start and end times." } as const;
  if (end_time <= start_time) return { error: "End time must be after start time." } as const;

  const program = text(formData, "program");
  if (!isClassProgram(program)) return { error: "Choose a program." } as const;

  const coach = text(formData, "coach_id");
  return {
    value: { name, day_of_week, start_time, end_time, program, coach_id: coach || null },
  } as const;
}

function refresh() {
  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  revalidatePath("/schedule");
}

export async function createClass(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseClass(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert(parsed.value);
  if (error) return { error: `Could not save class: ${error.message}` };

  refresh();
  redirect("/admin/classes");
}

export async function updateClass(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseClass(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(parsed.value).eq("id", id);
  if (error) return { error: `Could not save class: ${error.message}` };

  refresh();
  redirect("/admin/classes");
}

export async function deleteClass(id: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) {
    // 23503 = foreign_key_violation (attendance rows still reference this class)
    return {
      error:
        error.code === "23503"
          ? "This class has attendance records and can't be deleted. Edit it instead."
          : `Could not delete class: ${error.message}`,
    };
  }

  refresh();
  redirect("/admin/classes");
}
