import { ProgressView } from "@/components/member/progress-view";
import { getMemberPhotoUrl, requireMember } from "@/lib/member-auth";
import type { MemberProgress } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";

export default async function MemberHomePage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_progress");
  const progress = (data as unknown as MemberProgress | null) ?? null;

  if (!progress) {
    return (
      <p role="alert" className="card p-6 text-danger">
        We couldn&apos;t load your progress{error ? `: ${error.message}` : ""}. Please try again, or ask a coach.
      </p>
    );
  }

  return (
    <ProgressView
      data={progress}
      nickname={member.nickname}
      bio={member.bio}
      photoUrl={await getMemberPhotoUrl(member)}
    />
  );
}
