"use server";

import { revalidatePath } from "next/cache";
import { credentialsMessage, deliverCredentials, resetTooSoon, type AccessResult } from "@/lib/account-tools";
import { requireAdmin } from "@/lib/auth";
import { UUID_RE } from "@/lib/member";
import { generateTempPassword } from "@/lib/passwords";
import { normalizePhone } from "@/lib/phone";
import { createAdminClient, isAdminClientConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Add a coach/admin: creates their login, and texts them a temporary password. Admin only. */
export async function createStaff(_prev: AccessResult, formData: FormData): Promise<AccessResult> {
  const me = await requireAdmin();
  if (!isAdminClientConfigured()) return { error: NOT_CONFIGURED_MESSAGE };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const full_name = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "coach");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address — it's their sign-in." };
  if (!full_name) return { error: "Enter their name." };
  if (role !== "admin" && role !== "coach") return { error: "Choose a role." };

  let phone: string | null = null;
  if (phoneRaw) {
    const n = normalizePhone(phoneRaw);
    if (!n.e164) return { error: n.error };
    phone = n.e164;
  }

  const admin = createAdminClient();
  const password = generateTempPassword();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { kind: "staff" },
  });
  if (error || !created.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? "");
    return { error: exists ? "Someone with that email already has an account." : `Could not create the login: ${error?.message}` };
  }

  const { error: rowError } = await admin
    .from("staff_profiles")
    .insert({ user_id: created.user.id, full_name, role, phone, must_change_password: true });
  if (rowError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Could not save the staff profile: ${rowError.message}` };
  }

  const delivery = await deliverCredentials({
    targetKind: "staff",
    targetId: created.user.id,
    purpose: "account_created",
    phone,
    createdBy: me.user_id,
    message: credentialsMessage({ name: full_name, login: email, loginLabel: "email", password, area: "admin", reset: false }),
  });

  revalidatePath("/admin/staff");
  return { done: `${full_name} can now sign in.`, delivery };
}

/** Save the number password-reset texts are sent to. Admin only. */
export async function updateStaffPhone(userId: string, _prev: AccessResult, formData: FormData): Promise<AccessResult> {
  await requireAdmin();
  if (!UUID_RE.test(userId)) return { error: "Invalid request." };
  const raw = String(formData.get("phone") ?? "").trim();

  let phone: string | null = null;
  if (raw) {
    const n = normalizePhone(raw);
    if (!n.e164) return { error: n.error };
    phone = n.e164;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_profiles").update({ phone }).eq("user_id", userId);
  if (error) return { error: `Could not save: ${error.message}` };
  revalidatePath("/admin/staff");
  return { done: phone ? "Phone saved." : "Phone removed." };
}

/** "Forgot password": new temporary password, texted to the staff member. Admin only. */
export async function resetStaffPassword(userId: string): Promise<AccessResult> {
  const me = await requireAdmin();
  if (!isAdminClientConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  if (!UUID_RE.test(userId)) return { error: "Invalid request." };
  if (userId === me.user_id) return { error: "To change your own password, use Change password (top right)." };

  const supabase = await createClient();
  const { data: row } = await supabase.from("staff_profiles").select("full_name, phone").eq("user_id", userId).maybeSingle();
  if (!row) return { error: "Staff member not found." };
  if (await resetTooSoon(userId)) return { error: "A reset was just sent. Please wait a couple of minutes before sending another." };

  const admin = createAdminClient();
  const { data: user, error: lookupError } = await admin.auth.admin.getUserById(userId);
  if (lookupError || !user.user?.email) return { error: "Could not find that account." };

  const password = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: `Could not reset the password: ${error.message}` };
  await admin.from("staff_profiles").update({ must_change_password: true }).eq("user_id", userId);

  const delivery = await deliverCredentials({
    targetKind: "staff",
    targetId: userId,
    purpose: "password_reset",
    phone: row.phone,
    createdBy: me.user_id,
    message: credentialsMessage({
      name: row.full_name,
      login: user.user.email,
      loginLabel: "email",
      password,
      area: "admin",
      reset: true,
    }),
  });

  revalidatePath("/admin/staff");
  return { done: `Password reset for ${row.full_name}.`, delivery };
}

/** Remove someone's access. Admin only; you can't remove yourself or the last admin. */
export async function removeStaff(userId: string): Promise<AccessResult> {
  const me = await requireAdmin();
  if (!UUID_RE.test(userId)) return { error: "Invalid request." };
  if (userId === me.user_id) return { error: "You can't remove your own access." };

  const supabase = await createClient();
  const { data: target } = await supabase.from("staff_profiles").select("role").eq("user_id", userId).maybeSingle();
  if (!target) return { error: "Staff member not found." };
  if (target.role === "admin") {
    const { count } = await supabase.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) return { error: "There must be at least one admin." };
  }

  if (isAdminClientConfigured()) {
    // Deleting the login also deletes the staff row (cascade) and can't be signed back into.
    const { error } = await createAdminClient().auth.admin.deleteUser(userId);
    if (error) return { error: `Could not remove: ${error.message}` };
  } else {
    const { error } = await supabase.from("staff_profiles").delete().eq("user_id", userId);
    if (error) return { error: `Could not remove: ${error.message}` };
  }

  revalidatePath("/admin/staff");
  return { done: "Access removed." };
}
