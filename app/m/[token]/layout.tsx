import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check in",
  robots: { index: false, follow: false },
  // The personal token is in the URL — don't leak it to other sites via the Referer header.
  referrer: "no-referrer",
};

export default function MemberCheckInLayout({ children }: LayoutProps<"/m/[token]">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-[#2456b5] text-sm font-black text-white shadow-lg shadow-brand/30">
            289
          </span>
          <span className="text-sm uppercase tracking-widest">Saved By Grace</span>
        </Link>
        <Link href="/member" className="text-sm font-semibold text-accent hover:underline">
          My progress →
        </Link>
      </div>
      {children}
    </div>
  );
}
