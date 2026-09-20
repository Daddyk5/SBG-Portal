import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-[#2456b5] text-sm font-black text-white shadow-lg shadow-brand/30 transition group-hover:scale-105">
            289
          </span>
          <span className="hidden text-sm uppercase tracking-widest sm:inline">Saved By Grace</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* No-JS mobile menu */}
        <details className="group/menu relative md:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-border bg-surface hover:bg-foreground/10 [&::-webkit-details-marker]:hidden"
            aria-label={`Menu — ${SITE.shortName}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 top-13 w-60 rounded-2xl border border-border bg-surface-solid p-2 shadow-2xl"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-foreground/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
