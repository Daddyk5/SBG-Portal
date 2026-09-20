import { cache } from "react";
import { redirect } from "next/navigation";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { signParticipantPhotos } from "@/lib/storage";
import type { MemberProfile } from "@/lib/member";

/**
 * Members sign in with a username, but Supabase Auth wants an email. So each member account
 * gets an internal address built from the username (members never see or use it). Set
 * MEMBER_EMAIL_DOMAIN if you'd rather use a domain you own.
 */
const MEMBER_EMAIL_DOMAIN = process.env.MEMBER_EMAIL_DOMAIN ?? "members.sbg.local";
export const memberEmail = (username: string) => `${username.trim().toLowerCase()}@${MEMBER_EMAIL_DOMAIN}`;

/**
 * The signed-in MEMBER (not staff) for this request, or null. Members are identified by the
 * `my_profile()` SQL function, which returns their own row and nothing about anyone else.
 */
export const getMember = cache(async (): Promise<MemberProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("my_profile");
  return (data as unknown as MemberProfile | null) ?? null;
});

export async function requireMember(options: { allowMustChange?: boolean } = {}): Promise<MemberProfile> {
  const member = await getMember();
  if (!member) redirect("/member/login?error=no-access");
  if (member.must_change_password && !options.allowMustChange) redirect("/member/change-password");
  return member;
}

/** A 1-hour signed URL for the member's own photo (members have no direct storage access). */
export async function getMemberPhotoUrl(member: MemberProfile): Promise<string | null> {
  if (!member.photo_path || !isAdminClientConfigured()) return null;
  const urls = await signParticipantPhotos(createAdminClient(), [member.photo_path]);
  return urls.get(member.photo_path) ?? null;
}
