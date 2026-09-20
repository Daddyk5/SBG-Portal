/* eslint-disable @next/next/no-img-element -- QR data URL */
import Link from "next/link";
import QRCode from "qrcode";
import { CheckInList, type CheckInPerson } from "@/components/admin/check-in-list";
import { requireStaff } from "@/lib/auth";
import { DAY_NAMES, formatDate, formatTime, gymToday, programsServedBy } from "@/lib/constants";
import { ProgramBadge } from "@/components/program-badge";
import { SITE } from "@/lib/site";
import { signParticipantPhotos } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { Belt } from "@/lib/constants";
import type { ClassRow } from "@/lib/types";

export const metadata = { title: "Check-in" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function CheckInPage({ searchParams }: PageProps<"/admin/check-in">) {
  await requireStaff();
  const sp = await searchParams;
  const today = gymToday();
  const dateParam = one(sp.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && dateParam <= today.date ? dateParam : today.date;
  const classParam = one(sp.class);

  const supabase = await createClient();
  const { data: classData } = await supabase
    .from("classes")
    .select("id, name, day_of_week, start_time, end_time, program, coach_id")
    .order("day_of_week")
    .order("start_time");
  const classes = (classData ?? []) as ClassRow[];
  const selected = UUID.test(classParam) ? classes.find((c) => c.id === classParam) : undefined;

  // --- Step 1: pick a class -------------------------------------------------
  if (!selected) {
    const todays = classes.filter((c) => c.day_of_week === today.dow);
    const doorQr = await QRCode.toDataURL(`${SITE.url}/checkin`, { margin: 2, width: 320 });
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check-in</h1>
          <p className="mt-1 text-muted">Pick a class to take attendance.</p>
        </div>

        <section>
          <h2 className="text-lg font-bold">Today — {DAY_NAMES[today.dow]}</h2>
          {todays.length === 0 ? (
            <p className="card mt-3 p-6 text-muted">No classes scheduled today.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {todays.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/check-in?class=${c.id}`}
                    className="card flex min-h-16 items-center justify-between gap-4 px-5 py-4 hover:bg-foreground/5"
                  >
                    <span>
                      <span className="block font-semibold">{c.name}</span>
                      <span className="mt-1 block">
                        <ProgramBadge program={c.program} />
                      </span>
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatTime(c.start_time)} – {formatTime(c.end_time)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold">A different class or date</h2>
          <p className="text-sm text-muted">Use this to record a session you missed.</p>
          <form method="get" className="card mt-3 space-y-4 p-5">
            <div>
              <label htmlFor="class" className="label">
                Class
              </label>
              <select id="class" name="class" required defaultValue="" className="field">
                <option value="" disabled>
                  Select a class…
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {DAY_NAMES[c.day_of_week]} {formatTime(c.start_time)} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="label">
                Session date
              </label>
              <input id="date" name="date" type="date" defaultValue={today.date} max={today.date} className="field" />
            </div>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </form>
        </section>

        <section className="card flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <img src={doorQr} alt={`QR code for ${SITE.url}/checkin`} width={128} height={128} className="rounded-md bg-white" />
          <div>
            <h2 className="text-lg font-bold">Gym door QR</h2>
            <p className="mt-1 text-sm text-muted">
              Print this and post it at the door. Members who have opened their personal QR link
              once can scan it to check themselves in to today&apos;s class.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // --- Step 2: tick off participants ----------------------------------------
  const [peopleRes, attendanceRes] = await Promise.all([
    supabase
      .from("participants")
      .select("id, full_name, belt_rank, stripes, program, photo_url")
      .eq("status", "active")
      .order("full_name")
      .limit(1000),
    supabase.from("attendance").select("participant_id").eq("class_id", selected.id).eq("session_date", date),
  ]);
  const rows = peopleRes.data ?? [];
  const photos = await signParticipantPhotos(supabase, rows.map((r) => r.photo_url));
  const people: CheckInPerson[] = rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    belt_rank: r.belt_rank as Belt,
    stripes: r.stripes,
    program: r.program ?? [],
    photoUrl: r.photo_url ? (photos.get(r.photo_url) ?? null) : null,
  }));
  const initialPresent = (attendanceRes.data ?? []).map((a) => a.participant_id);

  const here = `/admin/check-in?class=${selected.id}${date === today.date ? "" : `&date=${date}`}`;
  const wrongDay = new Date(`${date}T00:00:00Z`).getUTCDay() !== selected.day_of_week;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/admin/check-in" className="text-sm text-muted hover:text-foreground">
        ← Change class
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{selected.name}</h1>
        <p className="text-muted">
          {DAY_NAMES[selected.day_of_week]} {formatTime(selected.start_time)} –{" "}
          {formatTime(selected.end_time)} · {selected.program}
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="class" value={selected.id} />
        <div>
          <label htmlFor="session-date" className="label">
            Session date
          </label>
          <input id="session-date" name="date" type="date" defaultValue={date} max={today.date} className="field" />
        </div>
        <button type="submit" className="btn-secondary">
          Go
        </button>
        <Link
          href={`/admin/participants/new?return_to=${encodeURIComponent(here)}`}
          className="btn-secondary ml-auto"
        >
          + Add walk-in
        </Link>
      </form>

      {date !== today.date && (
        <p role="status" className="card p-3 text-sm">
          Recording a past session: {formatDate(date)}.
        </p>
      )}
      {wrongDay && (
        <p role="status" className="card border-danger/40 p-3 text-sm text-danger">
          {formatDate(date)} isn&apos;t a {DAY_NAMES[selected.day_of_week]}, when this class normally runs.
        </p>
      )}

      {/* key resets the client state when the class or date changes */}
      <CheckInList
        key={`${selected.id}:${date}`}
        people={people}
        initialPresent={initialPresent}
        classId={selected.id}
        sessionDate={date}
        servedPrograms={programsServedBy(selected.program)}
        programLabel={selected.program}
      />
    </div>
  );
}
