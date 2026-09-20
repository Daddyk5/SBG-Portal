import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffProfile } from "@/lib/types";

/**
 * Verified staff member for the current request, or null. Uses getUser() (which
 * revalidates the token with Supabase) rather than trusting the cookie, then loads the
 * staff_profiles row that carries the role. Deduplicated per request via cache().
 */
export const getStaff = cache(async (): Promise<StaffProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("staff_profiles")
    .select("user_id, full_name, role, phone, must_change_password")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as StaffProfile | null) ?? null;
});

export async function requireStaff(): Promise<StaffProfile> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?error=no-access");
  // After a password reset the person must choose their own password before doing anything.
  if (staff.must_change_password) redirect("/admin/change-password");
  return staff;
}

export async function requireAdmin(): Promise<StaffProfile> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?notice=admin-only");
  return staff;
}
