import Link from "next/link";
import { BeltBadge } from "@/components/belt-badge";
import { ProgramBadge } from "@/components/program-badge";
import { requireStaff } from "@/lib/auth";
import { DAY_NAMES, formatDate, formatTime, gymToday, type Belt } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

type TodayClass = {
  id: string;
  name: string;
  program: string;
  start_time: string;
  end_time: string;
  coaches: { full_name: string } | null;
};

type RecentProgress = {
  id: string;
  entry_date: string;
  belt_rank: Belt | null;
  stripes: number | null;
  note: string | null;
  visible_to_member: boolean;
  participants: { id: string; full_name: string } | null;
};

type RecentCheckIn = {
  id: string;
  session_date: string;
  check_in_method: "staff" | "qr";
  participants: { id: string; full_name: string } | null;
  classes: { name: string } | null;
};

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { notice } = await searchParams;
  const supabase = await createClient();
  const today = gymToday();

  const [participants, classes, attendance, progress, checkIns] = await Promise.all([
    supabase.from("participants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("classes")
      .select("id, name, program, start_time, end_time, coaches(full_name)")
      .eq("day_of_week", today.dow)
      .order("start_time")
      .overrideTypes<TodayClass[]>(),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("session_date", today.date),
    supabase
      .from("progression_log")
      .select("id, entry_date, belt_rank, stripes, note, visible_to_member, participants(id, full_name)")
      .order("created_at", { ascending: false })
      .limit(6)
      .overrideTypes<RecentProgress[]>(),
    supabase
      .from("attendance")
      .select("id, session_date, check_in_method, participants(id, full_name), classes(name)")
      .order("checked_in_at", { ascending: false })
      .limit(6)
      .overrideTypes<RecentCheckIn[]>(),
  ]);

  const todaysClasses = classes.data ?? [];
  const stats = [
    { label: "Active participants", value: participants.count ?? 0 },
    { label: "Classes today", value: todaysClasses.length },
    { label: "Check-ins today", value: attendance.count ?? 0 },
  ];

  return (
    <div className="space-y-10">
      <div className="animate-fade-up">
        <h1 className="text-gradient pb-1 text-3xl font-black tracking-tight sm:text-4xl">
          Welcome, {staff.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted">
          {DAY_NAMES[today.dow]}, {formatDate(today.date)}
        </p>
      </div>

      {notice === "admin-only" && (
        <p role="status" className="card border-danger/40 p-4 text-sm text-danger">
          That page is for admins only.
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="card animate-fade-up p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="text-gradient mt-1 text-5xl font-black tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Today&apos;s classes</h2>
          <Link href="/admin/check-in" className="btn-primary">
            Open check-in
          </Link>
        </div>
        {todaysClasses.length === 0 ? (
          <p className="card mt-4 p-6 text-muted">No classes scheduled today.</p>
        ) : (
          <ul className="card mt-4 divide-y divide-border">
            {todaysClasses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/check-in?class=${c.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-foreground/5"
                >
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <ProgramBadge program={c.program} />
                      {c.coaches && <span>Coach {c.coaches.full_name}</span>}
                    </div>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatTime(c.start_time)} – {formatTime(c.end_time)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold">Recent progress &amp; feedback</h2>
          {(progress.data ?? []).length === 0 ? (
            <p className="card mt-4 p-6 text-sm text-muted">
              Nothing logged yet. Open a participant to add a promotion or feedback.
            </p>
          ) : (
            <ul className="card mt-4 divide-y divide-border">
              {(progress.data ?? []).map((e) => (
                <li key={e.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {e.participants ? (
                      <Link
                        href={`/admin/participants/${e.participants.id}`}
                        className="font-semibold hover:underline"
                      >
                        {e.participants.full_name}
                      </Link>
                    ) : (
                      <span className="font-semibold">Unknown</span>
                    )}
                    <span className="text-xs tabular-nums text-muted">{formatDate(e.entry_date)}</span>
                  </div>
                  {(e.belt_rank || e.stripes !== null) && (
                    <div className="mt-2">
                      <BeltBadge
                        belt={e.belt_rank ?? "white"}
                        stripes={e.stripes ?? 0}
                        label={
                          e.belt_rank
                            ? `Promoted to ${e.belt_rank}`
                            : `${e.stripes} ${e.stripes === 1 ? "stripe" : "stripes"}`
                        }
                      />
                    </div>
                  )}
                  {e.note && <p className="mt-2 line-clamp-2 text-sm text-muted">{e.note}</p>}
                  {e.note && (
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {e.visible_to_member ? "✉ Sent to member" : "🔒 Private"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold">Recent check-ins</h2>
          {(checkIns.data ?? []).length === 0 ? (
            <p className="card mt-4 p-6 text-sm text-muted">No attendance recorded yet.</p>
          ) : (
            <ul className="card mt-4 divide-y divide-border">
              {(checkIns.data ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    {a.participants ? (
                      <Link
                        href={`/admin/participants/${a.participants.id}`}
                        className="block truncate font-semibold hover:underline"
                      >
                        {a.participants.full_name}
                      </Link>
                    ) : (
                      <span className="font-semibold">Unknown</span>
                    )}
                    <p className="truncate text-sm text-muted">{a.classes?.name ?? "Deleted class"}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    <p className="tabular-nums">{formatDate(a.session_date)}</p>
                    <p>{a.check_in_method === "qr" ? "Self check-in (QR)" : "By coach"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
