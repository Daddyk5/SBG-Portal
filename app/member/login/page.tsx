import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/member-auth";
import { MemberLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Member sign in", robots: { index: false } };

export default async function MemberLoginPage({ searchParams }: PageProps<"/member/login">) {
  if (await getMember()) redirect("/member");

  const { error } = await searchParams;
  const notice =
    error === "no-access" ? "This account isn't an active member account. Sign in with your member username." : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand to-[#2456b5] text-xl font-black text-white shadow-xl shadow-brand/30">
            289
          </span>
          <p className="eyebrow mt-5">Members</p>
          <h1 className="text-gradient mt-3 pb-1 text-3xl font-black tracking-tight">My Progress</h1>
          <p className="mt-2 text-sm text-muted">See your belt, attendance and coach feedback.</p>
        </div>
        <div className="card p-6">
          <MemberLoginForm notice={notice} />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Forgot your password? Ask a coach at class — they can text you a new one.
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
