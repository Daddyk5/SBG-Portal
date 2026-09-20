"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { gymToday } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export type SetAttendanceResult = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mark a participant present (or undo it) for one class session. */
export async function setAttendance(
  participantId: string,
  classId: string,
  sessionDate: string,
  present: boolean,
): Promise<SetAttendanceResult> {
  const staff = await requireStaff();
  if (!UUID.test(participantId) || !UUID.test(classId)) return { error: "Invalid request." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || sessionDate > gymToday().date) {
    return { error: "Choose today or an earlier date." };
  }

  const supabase = await createClient();
  const { error } = present
    ? await supabase.from("attendance").upsert(
        {
          participant_id: participantId,
          class_id: classId,
          session_date: sessionDate,
          checked_in_by: staff.user_id,
        },
        { onConflict: "participant_id,class_id,session_date", ignoreDuplicates: true },
      )
    : await supabase
        .from("attendance")
        .delete()
        .eq("participant_id", participantId)
        .eq("class_id", classId)
        .eq("session_date", sessionDate);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/participants/${participantId}`);
  return {};
}
