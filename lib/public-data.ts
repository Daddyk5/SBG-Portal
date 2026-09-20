import { createPublicClient } from "@/lib/supabase/public";
import type { Coach, PublicScheduleRow } from "@/lib/types";

/** PostgREST error code for "table/view not in the schema cache" — i.e. migrations not run yet. */
const MISSING_RELATION = "PGRST205";

function report(what: string, error: { code?: string; message: string }) {
  if (error.code === MISSING_RELATION) {
    // Expected on a fresh project: don't raise a red error overlay, just say what to do.
    console.warn(
      `${what}: database not set up yet. Run supabase/setup.sql in the Supabase SQL Editor (see docs/deployment.md).`,
    );
  } else {
    console.error(`${what} failed:`, error.message);
  }
}

/** Weekly class schedule for the public site. Returns [] if Supabase is unavailable. */
export async function getSchedule(): Promise<PublicScheduleRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_schedule")
    .select("id, name, day_of_week, start_time, end_time, program, coach_name")
    .order("start_time");
  if (error) {
    report("getSchedule", error);
    return [];
  }
  return (data ?? []) as PublicScheduleRow[];
}

/** Coach bios for the public site. Returns [] if Supabase is unavailable. */
export async function getCoaches(): Promise<Coach[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("public_coaches")
    .select("id, full_name, bio, belt_rank, photo_url, sort_order")
    .order("sort_order")
    .order("full_name");
  if (error) {
    report("getCoaches", error);
    return [];
  }
  return (data ?? []) as Coach[];
}
