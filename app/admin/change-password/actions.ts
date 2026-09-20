"use server";

import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { checkNewPassword } from "@/lib/password-rules";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string } | undefined;

export async function changeStaffPassword(_prev: State, formData: FormData): Promise<State> {
  const staff = await getStaff(); // not requireStaff: this page must work while a change is still required
  if (!staff) redirect("/admin/login");

  const password = String(formData.get("password") ?? "");
  const problem = checkNewPassword(password, String(formData.get("confirm") ?? ""));
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // Clear the "must change" flag. Coaches can't edit staff_profiles, so this uses the server key.
  if (staff.must_change_password) {
    if (isAdminClientConfigured()) {
      await createAdminClient().from("staff_profiles").update({ must_change_password: false }).eq("user_id", staff.user_id);
    } else {
      return { error: "Password saved, but the reset flag couldn't be cleared (SUPABASE_SECRET_KEY is missing)." };
    }
  }
  redirect("/admin");
}
