import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getMember } from "@/lib/member-auth";
import { changeMemberPassword } from "./actions";

export const metadata: Metadata = { title: "Choose a password", robots: { index: false } };

export default async function MemberChangePasswordPage() {
  const member = await getMember();
  if (!member) redirect("/member/login");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand to-[#2456b5] text-xl font-black text-white shadow-xl shadow-brand/30">
            289
          </span>
          <h1 className="text-gradient mt-5 pb-1 text-3xl font-black tracking-tight">Choose a password</h1>
        </div>
        <div className="card p-6">
          <ChangePasswordForm action={changeMemberPassword} forced={member.must_change_password} />
        </div>
        {!member.must_change_password && (
          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/member/settings" className="hover:text-foreground">
              ← Back to settings
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
