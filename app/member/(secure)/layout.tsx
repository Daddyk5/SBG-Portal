import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { MemberTabs } from "@/components/member/member-tabs";
import { ThemeScope } from "@/components/member/theme-scope";
import { getMemberPhotoUrl, requireMember } from "@/lib/member-auth";
import { memberLogout } from "../login/actions";

export const metadata: Metadata = {
  title: "My Progress",
  robots: { index: false, follow: false },
};

export default async function MemberLayout({ children }: LayoutProps<"/member">) {
  const member = await requireMember();
  const photoUrl = await getMemberPhotoUrl(member);
  const displayName = member.nickname || member.full_name.split(" ")[0];

  return (
    <ThemeScope theme={member.theme} accent={member.accent}>
      <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-[#2456b5] text-sm font-black text-white shadow-lg shadow-brand/30">
              289
            </span>
            <span className="hidden text-sm uppercase tracking-widest sm:inline">Saved By Grace</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Avatar name={member.full_name} src={photoUrl} size={32} />
              <span className="max-w-28 truncate font-medium">{displayName}</span>
            </div>
            <form action={memberLogout}>
              <button type="submit" className="btn-secondary">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="mb-6">
          <MemberTabs
            tabs={[
              { href: "/member", label: "My progress" },
              { href: "/member/settings", label: "Settings" },
            ]}
          />
        </div>
        {children}
      </div>
    </ThemeScope>
  );
}
