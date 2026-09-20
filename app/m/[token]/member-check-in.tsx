"use client";

import { useState, useTransition } from "react";
import { formatTime } from "@/lib/constants";
import { ProgramBadge } from "@/components/program-badge";
import { memberCheckIn } from "./actions";

export type MemberClass = {
  id: string;
  name: string;
  program: string;
  start_time: string;
  end_time: string;
  coach_name: string | null;
  open: boolean;
  checked_in: boolean;
};

export function MemberCheckIn({
  token,
  name,
  classes,
}: {
  token: string;
  name: string;
  classes: MemberClass[];
}) {
  const [done, setDone] = useState(() => new Set(classes.filter((c) => c.checked_in).map((c) => c.id)));
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function checkIn(classId: string) {
    setMessage(null);
    setPendingId(classId);
    startTransition(async () => {
      const result = await memberCheckIn(token, classId);
      setPendingId(null);
      if (result.status === "ok" || result.status === "already") {
        setDone((prev) => new Set(prev).add(classId));
        setMessage(result.status === "ok" ? "You're checked in. Enjoy your training!" : "You were already checked in.");
      } else if (result.status === "closed") {
        setMessage("Check-in for that class isn't open right now.");
      } else {
        setMessage("Something went wrong. Please ask a coach to check you in.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <p className="text-sm text-muted">Welcome</p>
        <h1 className="text-gradient pb-1 text-4xl font-black tracking-tight">{name}</h1>
      </div>

      {message && (
        <p role="status" className="card border-accent/30 p-4 text-sm">
          {message}
        </p>
      )}

      {classes.length === 0 ? (
        <p className="card p-6 text-muted">There are no classes today.</p>
      ) : (
        <ul className="space-y-3">
          {classes.map((c) => {
            const checkedIn = done.has(c.id);
            return (
              <li key={c.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-lg font-semibold">{c.name}</p>
                  <ProgramBadge program={c.program} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {formatTime(c.start_time)} – {formatTime(c.end_time)}
                  {c.coach_name ? ` · Coach ${c.coach_name}` : ""}
                </p>
                <button
                  type="button"
                  disabled={checkedIn || !c.open || pendingId !== null}
                  onClick={() => checkIn(c.id)}
                  className="btn-primary mt-4 w-full"
                >
                  {checkedIn ? "✓ Checked in" : pendingId === c.id ? "Checking in…" : c.open ? "Check in" : "Not open yet"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted">
        Check-in opens 60 minutes before class starts. This page is personal to you — keep it private.
      </p>
    </div>
  );
}
