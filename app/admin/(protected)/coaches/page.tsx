import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BeltBadge } from "@/components/belt-badge";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Coach } from "@/lib/types";

export const metadata = { title: "Coaches" };

export default async function CoachesAdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("coaches").select("*").order("sort_order").order("full_name");
  const coaches = (data ?? []) as Coach[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coaches</h1>
          <p className="text-muted">These profiles appear on the public Coaches page.</p>
        </div>
        <Link href="/admin/coaches/new" className="btn-primary">
          Add coach
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          Could not load coaches: {error.message}
        </p>
      )}

      {coaches.length === 0 ? (
        <p className="card p-8 text-center text-muted">No coaches yet.</p>
      ) : (
        <ul className="card divide-y divide-border">
          {coaches.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/coaches/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-foreground/5">
                <Avatar name={c.full_name} src={c.photo_url} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.full_name}</span>
                  {c.bio && <span className="block truncate text-sm text-muted">{c.bio}</span>}
                </span>
                {c.belt_rank && <BeltBadge belt={c.belt_rank} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
