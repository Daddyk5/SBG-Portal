import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { DAY_NAMES, DAYS_MONDAY_FIRST, formatTime } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Classes" };

type ClassWithCoach = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  program: string;
  coaches: { full_name: string } | null;
};

export default async function ClassesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, day_of_week, start_time, end_time, program, coaches(full_name)")
    .order("start_time")
    .overrideTypes<ClassWithCoach[]>();
  const classes = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted">This is the schedule shown on the public website.</p>
        </div>
        <Link href="/admin/classes/new" className="btn-primary">
          Add class
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          Could not load classes: {error.message}
        </p>
      )}

      {classes.length === 0 ? (
        <p className="card p-8 text-center text-muted">No classes yet. Add your first class.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {DAYS_MONDAY_FIRST.map((dow) => {
            const items = classes.filter((c) => c.day_of_week === dow);
            if (items.length === 0) return null;
            return (
              <section key={dow} className="card overflow-hidden">
                <h2 className="border-b border-border bg-foreground/5 px-5 py-3 font-bold">{DAY_NAMES[dow]}</h2>
                <ul className="divide-y divide-border">
                  {items.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/classes/${c.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-foreground/5"
                      >
                        <span>
                          <span className="block font-semibold">{c.name}</span>
                          <span className="text-sm text-muted">
                            {c.program}
                            {c.coaches ? ` · ${c.coaches.full_name}` : ""}
                          </span>
                        </span>
                        <span className="text-sm tabular-nums">
                          {formatTime(c.start_time)} – {formatTime(c.end_time)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
