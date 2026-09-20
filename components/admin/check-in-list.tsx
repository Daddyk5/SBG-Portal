"use client";

import { useMemo, useState, useTransition } from "react";
import { setAttendance } from "@/app/admin/(protected)/check-in/actions";
import { Avatar } from "@/components/avatar";
import { BeltBadge } from "@/components/belt-badge";
import type { Belt } from "@/lib/constants";

export type CheckInPerson = {
  id: string;
  full_name: string;
  belt_rank: Belt;
  stripes: number;
  program: string[];
  photoUrl: string | null;
};

type Filter = "all" | "present" | "absent";

export function CheckInList({
  people,
  initialPresent,
  classId,
  sessionDate,
  servedPrograms,
  programLabel,
}: {
  people: CheckInPerson[];
  initialPresent: string[];
  classId: string;
  sessionDate: string;
  /** Participant enrolments this class serves, e.g. ["Muay Thai", "Kickboxing"] */
  servedPrograms: string[];
  programLabel: string;
}) {
  const [present, setPresent] = useState(() => new Set(initialPresent));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [programOnly, setProgramOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (q && !p.full_name.toLowerCase().includes(q)) return false;
      if (programOnly && !p.program.some((x) => servedPrograms.includes(x))) return false;
      if (filter === "present" && !present.has(p.id)) return false;
      if (filter === "absent" && present.has(p.id)) return false;
      return true;
    });
  }, [people, query, filter, programOnly, present, servedPrograms]);

  function toggle(id: string) {
    const next = !present.has(id);
    setError(null);
    setPresent((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
    startTransition(async () => {
      const result = await setAttendance(id, classId, sessionDate, next);
      if (result.error) {
        // Roll back the optimistic change.
        setPresent((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(id);
          else copy.add(id);
          return copy;
        });
        setError(`Couldn't save that change: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-background/80 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:px-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-bold tabular-nums" aria-live="polite">
            {present.size} present
          </p>
          <div role="group" aria-label="Show" className="flex gap-1">
            {(["all", "present", "absent"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`btn min-h-11 capitalize ${filter === f ? "bg-foreground text-background" : "border border-border bg-surface backdrop-blur-md"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <label className="sr-only" htmlFor="check-in-search">
          Search participants
        </label>
        <input
          id="check-in-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="field"
          autoComplete="off"
        />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={programOnly}
            onChange={(e) => setProgramOnly(e.target.checked)}
            className="size-4 accent-[var(--brand)]"
          />
          Only show {programLabel} students
        </label>
      </div>

      {error && (
        <p role="alert" className="card border-danger/40 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="card p-6 text-center text-muted">No participants match.</p>
      ) : (
        <ul className="card divide-y divide-border">
          {visible.map((p) => {
            const isPresent = present.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={isPresent}
                  className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isPresent ? "bg-success/10" : "hover:bg-foreground/5"
                  }`}
                >
                  <Avatar name={p.full_name} src={p.photoUrl} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.full_name}</span>
                    <span className="mt-1 block">
                      <BeltBadge belt={p.belt_rank} stripes={p.stripes} />
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold ${
                      isPresent ? "border-success bg-success text-background" : "border-border"
                    }`}
                  >
                    {isPresent ? "✓" : ""}
                  </span>
                  <span className="sr-only">{isPresent ? "Present" : "Not present"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
