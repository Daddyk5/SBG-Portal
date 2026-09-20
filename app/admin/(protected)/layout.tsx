import Link from "next/link";
import { AdminNav, type AdminNavItem } from "@/components/admin/admin-nav";
import { requireStaff } from "@/lib/auth";
import { logout } from "../login/actions";

export const metadata = { robots: { index: false, follow: false } };

const NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/check-in", label: "Check-in" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/classes", label: "Classes", adminOnly: true },
  { href: "/admin/coaches", label: "Coaches", adminOnly: true },
  { href: "/admin/staff", label: "Staff", adminOnly: true },
  { href: "/admin/usage", label: "Usage", adminOnly: true },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();
  const items = NAV.filter((item) => !item.adminOnly || staff.role === "admin");

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 font-bold tracking-tight">
              <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand to-[#2456b5] text-sm font-black text-white shadow-lg shadow-brand/30">
                289
              </span>
              <span>Admin</span>
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted sm:inline">
                {staff.full_name} · {staff.role}
              </span>
              <Link href="/admin/change-password" className="btn-secondary hidden sm:inline-flex">
                Change password
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-secondary">
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <div className="pb-3">
            <AdminNav items={items} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
