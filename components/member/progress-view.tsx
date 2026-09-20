import { AttendanceHeatmap } from "@/components/attendance-heatmap";
import { Avatar } from "@/components/avatar";
import { BeltBadge } from "@/components/belt-badge";
import { formatDate } from "@/lib/constants";
import type { MemberProgress } from "@/lib/member";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-gradient mt-1 text-4xl font-black tabular-nums">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A member's own view: belt, attendance and the feedback their coaches chose to share. */
export function ProgressView({
  data,
  nickname,
  bio,
  photoUrl,
}: {
  data: MemberProgress;
  nickname?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
}) {
  return (
    <div className="space-y-6">
      <header className="card animate-fade-up p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Avatar name={data.name} src={photoUrl} size={72} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">My progress</p>
            <h1 className="text-gradient mt-3 pb-1 text-3xl font-black tracking-tight sm:text-4xl">
              {nickname || data.name}
            </h1>
            {nickname && <p className="text-sm text-muted">{data.name}</p>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BeltBadge belt={data.belt_rank} stripes={data.stripes} label={`${data.belt_rank} belt`} />
          <span className="text-sm text-muted">Member since {formatDate(data.date_joined)}</span>
        </div>
        {bio && (
          <p className="mt-4 whitespace-pre-line border-l-2 border-accent/40 pl-3 text-sm italic text-muted">{bio}</p>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Classes attended" value={data.total_sessions} hint="all time" />
        <Stat label="Last 30 days" value={data.sessions_30d} hint="classes" />
        <div className="col-span-2 sm:col-span-1">
          <Stat
            label="Current stripes"
            value={data.stripes}
            hint={`on your ${data.belt_rank} belt`}
          />
        </div>
      </dl>

      <section className="card animate-fade-up p-6 [animation-delay:80ms]">
        <h2 className="text-lg font-bold">Attendance</h2>
        <div className="mt-4">
          <AttendanceHeatmap dates={data.attendance_dates} today={data.today} />
        </div>
        {data.recent_sessions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted">Recent classes</h3>
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {data.recent_sessions.slice(0, 8).map((s, i) => (
                <li key={`${s.date}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="font-medium">{s.class_name}</span>
                  <span className="tabular-nums text-muted">{formatDate(s.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {data.recent_sessions.length === 0 && (
          <p className="mt-4 text-sm text-muted">No classes recorded yet — see you on the mats!</p>
        )}
      </section>

      <section className="card animate-fade-up p-6 [animation-delay:140ms]">
        <h2 className="text-lg font-bold">Your journey &amp; coach feedback</h2>
        {data.timeline.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Your coaches haven&apos;t shared any updates yet. Keep training — feedback and promotions will
            show up here.
          </p>
        ) : (
          <ol className="relative mt-5 space-y-6 border-l-2 border-border pl-6">
            {data.timeline.map((entry, i) => {
              const promoted = entry.belt_rank !== null || entry.stripes !== null;
              return (
                <li key={`${entry.entry_date}-${i}`} className="relative">
                  <span
                    className="absolute -left-[1.95rem] top-1 size-3.5 rounded-full border-2 border-background bg-linear-to-br from-brand to-[#2456b5]"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-muted">{formatDate(entry.entry_date)}</p>
                  {promoted && (
                    <div className="mt-1.5">
                      <BeltBadge
                        belt={entry.belt_rank ?? data.belt_rank}
                        stripes={entry.stripes ?? 0}
                        label={
                          entry.belt_rank
                            ? `Promoted to ${entry.belt_rank} belt`
                            : `${entry.stripes} ${entry.stripes === 1 ? "stripe" : "stripes"}`
                        }
                      />
                    </div>
                  )}
                  {entry.note && (
                    <figure className="mt-2 rounded-2xl rounded-tl-sm border border-accent/25 bg-accent/10 px-4 py-3">
                      <figcaption className="text-xs font-semibold uppercase tracking-wider text-accent">
                        Coach feedback
                      </figcaption>
                      <p className="mt-1 whitespace-pre-line">{entry.note}</p>
                    </figure>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
