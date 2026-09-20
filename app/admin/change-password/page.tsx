import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getStaff } from "@/lib/auth";
import { changeStaffPassword } from "./actions";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default async function ChangePasswordPage() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");

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
          <ChangePasswordForm action={changeStaffPassword} forced={staff.must_change_password} />
        </div>
        {!staff.must_change_password && (
          <p className="mt-4 text-center text-sm text-muted">
            <Link href="/admin" className="hover:text-foreground">
              ← Back to dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
