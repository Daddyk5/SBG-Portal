"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MemberTabs({ tabs }: { tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Member" className="flex gap-1 rounded-2xl border border-border bg-surface p-1 backdrop-blur-md">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
              active ? "bg-brand text-brand-fg shadow-md" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
