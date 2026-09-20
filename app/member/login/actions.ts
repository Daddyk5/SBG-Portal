"use server";

import { redirect } from "next/navigation";
import { memberEmail } from "@/lib/member-auth";
import { USERNAME_RE } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

export async function memberLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };
  // Same message for every failure, so this can't be used to discover which usernames exist.
  if (!USERNAME_RE.test(username)) return { error: "Incorrect username or password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: memberEmail(username), password });
  if (error) return { error: "Incorrect username or password." };

  // Signing in isn't enough: the account must belong to an active member.
  const { data: profile } = await supabase.rpc("my_profile");
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account isn't an active member account. Please ask a coach." };
  }

  redirect("/member");
}

export async function memberLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/member/login");
}
