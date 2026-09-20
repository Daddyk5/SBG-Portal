import Link from "next/link";
import { NAV_LINKS, SITE, STATIC_SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{SITE.name}</p>
          <p className="mt-2 text-sm text-muted">{SITE.tagline}</p>
          <p className="mt-2 text-sm text-muted">Affiliated with the {SITE.affiliation}.</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Find us</p>
          <address className="mt-3 space-y-1 text-sm not-italic text-muted">
            <p className="font-medium text-foreground">{SITE.address.venue}</p>
            {SITE.address.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="pt-2">
              <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-foreground">
                {SITE.email}
              </a>
            </p>
            <p>
              <a href={SITE.youtube} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                YouTube @SavedByGraceBJJ
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {SITE.name}.{" "}
        {!STATIC_SITE && (
          <Link href="/admin" className="hover:text-foreground">
            Staff
          </Link>
        )}
      </div>
    </footer>
  );
}
