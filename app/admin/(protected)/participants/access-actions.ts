"use server";

import { revalidatePath } from "next/cache";
import { credentialsMessage, deliverCredentials, resetTooSoon, type AccessResult } from "@/lib/account-tools";
import { requireStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/member";
import { memberEmail } from "@/lib/member-auth";
import { generateTempPassword, suggestUsername, USERNAME_RE } from "@/lib/passwords";
import { createAdminClient, isAdminClientConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ParticipantRow = {
  id: string;
  full_name: string;
  phone: string | null;
  user_id: string | null;
  username: string | null;
  status: string;
};

async function loadParticipant(id: string): Promise<ParticipantRow | null> {
  // Uses the signed-in staff member's own client, so RLS decides whether they may see it.
  const supabase = await createClient();
  const { data } = await supabase
    .from("participants")
    .select("id, full_name, phone, user_id, username, status")
    .eq("id", id)
    .maybeSingle();
  return (data as ParticipantRow | null) ?? null;
}

/** Give a member a login (username + temporary password) and text it to them. Any staff member. */
export async function createMemberLogin(
  participantId: string,
  _prev: AccessResult,
  formData: FormData,
): Promise<AccessResult> {
  const staff = await requireStaff();
  if (!isAdminClientConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  if (!UUID_RE.test(participantId)) return { error: "Invalid request." };

  const p = await loadParticipant(participantId);
  if (!p) return { error: "Participant not found." };
  if (p.user_id) return { error: "This member already has a login." };
  if (p.status !== "active") return { error: "Set the member to active before giving them a login." };

  const admin = createAdminClient();
  const typed = String(formData.get("username") ?? "").trim().toLowerCase();
  let username = typed || suggestUsername(p.full_name);
  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3–30 characters: lowercase letters, numbers, dots, dashes or underscores." };
  }

  // Find a free username. If the coach typed one it must be free; if we suggested it we add a number.
  const base = username;
  for (let i = 0; i < 25; i++) {
    username = i === 0 ? base : `${base.slice(0, 27)}${i + 1}`;
    const { data: taken } = await admin.from("participants").select("id").eq("username", username).maybeSingle();
    if (!taken) break;
    if (typed || i === 24) return { error: `The username "${base}" is already taken. Try another.` };
  }

  const password = generateTempPassword();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: memberEmail(username),
    password,
    email_confirm: true,
    user_metadata: { kind: "member" },
  });
  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return { error: taken ? "That username is already taken." : `Could not create the login: ${error?.message}` };
  }

  const userId = created.user.id;
  const { error: linkError } = await admin.from("participants").update({ user_id: userId, username }).eq("id", p.id);
  if (linkError) {
    await admin.auth.admin.deleteUser(userId); // roll back so nothing is left half-created
    return { error: `Could not link the login: ${linkError.message}` };
  }
  await admin.from("member_settings").upsert({ participant_id: p.id, must_change_password: true });

  const delivery = await deliverCredentials({
    targetKind: "member",
    targetId: p.id,
    purpose: "account_created",
    phone: p.phone,
    createdBy: staff.user_id,
    message: credentialsMessage({
      name: p.full_name,
      login: username,
      loginLabel: "username",
      password,
      area: "member",
      reset: false,
    }),
  });

  revalidatePath(`/admin/participants/${p.id}`);
  return { done: `Login created for ${p.full_name}.`, username, delivery };
}

/** "Forgot password": set a new temporary password and text it. Any staff member, for members. */
export async function resetMemberPassword(participantId: string): Promise<AccessResult> {
  const staff = await requireStaff();
  if (!isAdminClientConfigured()) return { error: NOT_CONFIGURED_MESSAGE };
  if (!UUID_RE.test(participantId)) return { error: "Invalid request." };

  const p = await loadParticipant(participantId);
  if (!p?.user_id || !p.username) return { error: "This member doesn't have a login yet." };
  if (await resetTooSoon(p.id)) return { error: "A reset was just sent. Please wait a couple of minutes before sending another." };

  const admin = createAdminClient();
  const password = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(p.user_id, { password });
  if (error) return { error: `Could not reset the password: ${error.message}` };
  await admin.from("member_settings").upsert({ participant_id: p.id, must_change_password: true });

  const delivery = await deliverCredentials({
    targetKind: "member",
    targetId: p.id,
    purpose: "password_reset",
    phone: p.phone,
    createdBy: staff.user_id,
    message: credentialsMessage({
      name: p.full_name,
      login: p.username,
      loginLabel: "username",
      password,
      area: "member",
      reset: true,
    }),
  });

  revalidatePath(`/admin/participants/${p.id}`);
  return { done: `Password reset for ${p.full_name}.`, username: p.username, delivery };
}
