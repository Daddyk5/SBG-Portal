import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getStaff()) redirect("/admin");

  const { error } = await searchParams;
  const notice =
    error === "no-access"
      ? "This account doesn't have staff access. Sign in with a staff account."
      : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand to-[#2456b5] text-xl font-black text-white shadow-xl shadow-brand/30">
            289
          </span>
          <p className="eyebrow mt-5">Staff only</p>
          <h1 className="text-gradient mt-3 pb-1 text-3xl font-black tracking-tight">Saved By Grace BJJ</h1>
        </div>
        <div className="card p-6">
          <LoginForm notice={notice} />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Forgot your password? Ask an admin to text you a reset.
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
