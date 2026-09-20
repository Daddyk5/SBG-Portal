"use server";

import { redirect } from "next/navigation";
import { getMember } from "@/lib/member-auth";
import { checkNewPassword } from "@/lib/password-rules";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string } | undefined;

export async function changeMemberPassword(_prev: State, formData: FormData): Promise<State> {
  const member = await getMember(); // not requireMember: must work while a change is still required
  if (!member) redirect("/member/login");

  const password = String(formData.get("password") ?? "");
  const problem = checkNewPassword(password, String(formData.get("confirm") ?? ""), [member.username ?? ""]);
  if (problem) return { error: problem };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  await supabase.rpc("mark_password_changed");
  redirect("/member");
}
