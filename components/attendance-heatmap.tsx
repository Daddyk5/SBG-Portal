const WEEKS = 26;
const DAY_MS = 86_400_000;

function toIso(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * GitHub-style calendar: one column per week (Mon–Sun rows), the last 26 weeks,
 * shaded by number of sessions attended that day. `today` is a YYYY-MM-DD string.
 */
export function AttendanceHeatmap({ dates, today }: { dates: string[]; today: string }) {
  const counts = new Map<string, number>();
  for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);

  const todayMs = Date.parse(`${today}T00:00:00Z`);
  const mondayOffset = (new Date(todayMs).getUTCDay() + 6) % 7; // Monday = 0
  const start = todayMs - mondayOffset * DAY_MS - (WEEKS - 1) * 7 * DAY_MS;

  const cells: { date: string; count: number; future: boolean }[] = [];
  let total = 0;
  for (let i = 0; i < WEEKS * 7; i++) {
    const ms = start + i * DAY_MS;
    const date = toIso(ms);
    const count = counts.get(date) ?? 0;
    total += count;
    cells.push({ date, count, future: ms > todayMs });
  }

  const shade = (count: number) => {
    if (count === 0) return "bg-foreground/10";
    if (count === 1) return "bg-brand/50";
    return "bg-brand";
  };

  return (
    <div>
      <div
        role="img"
        aria-label={`${total} sessions attended in the last ${WEEKS} weeks`}
        className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1"
        style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(12px, 1fr))` }}
      >
        {cells.map((cell) => (
          <span
            key={cell.date}
            title={`${cell.date}: ${cell.count} ${cell.count === 1 ? "session" : "sessions"}`}
            className={`aspect-square min-h-3 rounded-sm ${cell.future ? "opacity-0" : shade(cell.count)}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {total} {total === 1 ? "session" : "sessions"} in the last {WEEKS} weeks
      </p>
    </div>
  );
}
