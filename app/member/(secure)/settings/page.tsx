import type { Metadata } from "next";
import { PhotoForm, ProfileForm, SecurityCard } from "@/components/member/settings-forms";
import { getMemberPhotoUrl, requireMember } from "@/lib/member-auth";
import { saveProfile, uploadMyPhoto } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default async function MemberSettingsPage() {
  const member = await requireMember();
  const photoUrl = await getMemberPhotoUrl(member);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-gradient pb-1 text-3xl font-black tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">Make your page your own.</p>
      </div>
      <PhotoForm action={uploadMyPhoto} name={member.full_name} photoUrl={photoUrl} />
      <ProfileForm action={saveProfile} profile={member} />
      <SecurityCard username={member.username} />
    </div>
  );
}
