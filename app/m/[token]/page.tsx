import { InvalidLink } from "@/components/member/invalid-link";
import { RememberMember } from "@/components/member/remember-member";
import { UUID_RE } from "@/lib/member";
import { createPublicClient } from "@/lib/supabase/public";
import { MemberCheckIn, type MemberClass } from "./member-check-in";

type MemberInfo = { name: string; classes: MemberClass[] };

export default async function MemberPage({ params }: PageProps<"/m/[token]">) {
  const { token } = await params;

  let info: MemberInfo | null = null;
  const supabase = UUID_RE.test(token) ? createPublicClient({ fresh: true }) : null;
  if (supabase) {
    const { data } = await supabase.rpc("member_checkin_info", { p_token: token });
    info = (data as unknown as MemberInfo | null) ?? null;
  }

  if (!info) return <InvalidLink />;

  return (
    <>
      <RememberMember token={token} />
      <MemberCheckIn token={token} name={info.name} classes={info.classes} />
    </>
  );
}
