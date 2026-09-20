"use server";

import { createPublicClient } from "@/lib/supabase/public";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MemberCheckInResult =
  | { status: "ok" | "already"; name: string }
  | { status: "closed" | "invalid" | "error" };

/** QR self check-in. The member's secret token is the credential (see 0003_qr_checkin.sql). */
export async function memberCheckIn(token: string, classId: string): Promise<MemberCheckInResult> {
  if (!UUID.test(token) || !UUID.test(classId)) return { status: "invalid" };
  const supabase = createPublicClient({ fresh: true });
  if (!supabase) return { status: "error" };

  const { data, error } = await supabase.rpc("member_check_in", { p_token: token, p_class_id: classId });
  if (error || !data) return { status: "error" };
  return data as unknown as MemberCheckInResult;
}
