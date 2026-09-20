import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { BeltBadge } from "@/components/belt-badge";
import { requireStaff } from "@/lib/auth";
import { BELTS, PROGRAMS, STATUSES, isBelt, isProgram } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { signParticipantPhotos } from "@/lib/storage";
import type { Participant } from "@/lib/types";

export const metadata = { title: "Participants" };

const PAGE_LIMIT = 200;

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function ParticipantsPage({ searchParams }: PageProps<"/admin/participants">) {
  await requireStaff();
  const sp = await searchParams;
  const q = one(sp.q);
  const belt = one(sp.belt);
  const status = one(sp.status) || "active";
  const program = one(sp.program);

  const supabase = await createClient();
  let query = supabase
    .from("participants")
    .select("id, full_name, belt_rank, stripes, program, status, photo_url, email, phone", { count: "exact" })
    .order("full_name")
    .limit(PAGE_LIMIT);

  if (q) query = query.ilike("full_name", `%${q.replace(/[%_\\]/g, "\\$&")}%`);
  if (isBelt(belt)) query = query.eq("belt_rank", belt);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (isProgram(program)) query = query.contains("program", [program]);

  const { data, count, error } = await query;
  const rows = (data ?? []) as Pick<
    Participant,
    "id" | "full_name" | "belt_rank" | "stripes" | "program" | "status" | "photo_url" | "email" | "phone"
  >[];
  const photos = await signParticipantPhotos(supabase, rows.map((r) => r.photo_url));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Participants</h1>
        <Link href="/admin/participants/new" className="btn-primary">
          Add participant
        </Link>
      </div>

      <form method="get" className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="q" className="label">
            Search name
          </label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="e.g. Maria" className="field" />
        </div>
        <div>
          <label htmlFor="belt" className="label">
            Belt
          </label>
          <select id="belt" name="belt" defaultValue={belt} className="field capitalize">
            <option value="">All belts</option>
            {BELTS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="program" className="label">
            Program
          </label>
          <select id="program" name="program" defaultValue={program} className="field">
            <option value="">All programs</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className="field capitalize">
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-secondary w-full">
            Filter
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-danger">
          Could not load participants: {error.message}
        </p>
      )}

      <p className="text-sm text-muted">
        {count ?? 0} {count === 1 ? "participant" : "participants"}
        {(count ?? 0) > PAGE_LIMIT ? ` — showing the first ${PAGE_LIMIT}, refine your search` : ""}
      </p>

      {rows.length === 0 ? (
        <p className="card p-8 text-center text-muted">No participants match these filters.</p>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/participants/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-foreground/5"
              >
                <Avatar name={p.full_name} src={p.photo_url ? photos.get(p.photo_url) : null} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.full_name}</p>
                  <p className="truncate text-sm text-muted">
                    {p.program.length > 0 ? p.program.join(" · ") : "No program"}
                    {p.status === "inactive" ? " · Inactive" : ""}
                  </p>
                </div>
                <BeltBadge belt={p.belt_rank} stripes={p.stripes} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
