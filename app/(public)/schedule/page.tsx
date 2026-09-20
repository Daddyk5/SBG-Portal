import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { ProgramBadge } from "@/components/program-badge";
import { COMBINED_STRIKING, DAY_NAMES, DAYS_MONDAY_FIRST, formatTime } from "@/lib/constants";
import { getSchedule } from "@/lib/public-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Class Schedule",
  description: `Brazilian Jiu-Jitsu and Muay Thai & Kickboxing every ${SITE.trainingDay} in Davao City.`,
};

export default async function SchedulePage() {
  const classes = await getSchedule();
  const days = DAYS_MONDAY_FIRST.map((dow) => ({
    dow,
    items: classes.filter((c) => c.day_of_week === dow),
  })).filter((d) => d.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow={`Every ${SITE.trainingDay}`}
        title="Class Schedule"
        intro={`We train every ${SITE.trainingDay} at ${SITE.address.venue}, Bajada, Davao City. Brazilian Jiu-Jitsu is its own class; Muay Thai and Kickboxing are taught together in one session.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {days.length === 0 ? (
          <div className="card mx-auto max-w-3xl p-8">
            <h2 className="text-xl font-bold">Every {SITE.trainingDay}</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between gap-3">
                <span className="font-semibold">Brazilian Jiu-Jitsu</span>
                <ProgramBadge program="BJJ" />
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="font-semibold">Muay Thai &amp; Kickboxing</span>
                <ProgramBadge program={COMBINED_STRIKING} />
              </li>
            </ul>
            <p className="mt-5 text-sm text-muted">
              Exact class times are coming soon — message us on Messenger to confirm the start time.
            </p>
          </div>
        ) : (
          <div className={days.length === 1 ? "mx-auto max-w-3xl" : "grid gap-6 md:grid-cols-2"}>
            {days.map(({ dow, items }, di) => (
              <section
                key={dow}
                className="card animate-fade-up overflow-hidden"
                style={{ animationDelay: `${di * 80}ms` }}
              >
                <h2 className="flex items-center gap-3 border-b border-border px-6 py-4 text-xl font-bold">
                  <span className="size-2.5 rounded-full bg-linear-to-br from-brand to-[#2456b5]" aria-hidden="true" />
                  Every {DAY_NAMES[dow]}
                </h2>
                <ul className="divide-y divide-border">
                  {items.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-5">
                      <div>
                        <p className="text-lg font-semibold">{c.name}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                          <ProgramBadge program={c.program} />
                          {c.coach_name && <span>Coach {c.coach_name}</span>}
                        </div>
                      </div>
                      <p className="shrink-0 rounded-xl border border-border bg-foreground/5 px-3 py-1.5 text-sm font-semibold tabular-nums">
                        {formatTime(c.start_time)} – {formatTime(c.end_time)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
