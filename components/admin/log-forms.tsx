"use client";

import { useActionState } from "react";
import { BELTS, DAY_NAMES, formatTime } from "@/lib/constants";

type FormState = { error?: string; ok?: string } | undefined;
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Message({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p role="alert" className="text-sm text-danger">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="text-sm text-success">
        {state.ok}
      </p>
    );
  return null;
}

export function LogAttendanceForm({
  action,
  classes,
  today,
}: {
  action: Action;
  classes: { id: string; name: string; day_of_week: number; start_time: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="log-class" className="label">
          Class
        </label>
        <select id="log-class" name="class_id" required defaultValue="" className="field">
          <option value="" disabled>
            Select a class…
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {DAY_NAMES[c.day_of_week].slice(0, 3)} {formatTime(c.start_time)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="log-date" className="label">
          Session date
        </label>
        <input id="log-date" name="session_date" type="date" required defaultValue={today} max={today} className="field" />
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Log attendance"}
      </button>
    </form>
  );
}

export function ProgressionForm({ action, today }: { action: Action; today: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="prog-date" className="label">
            Date
          </label>
          <input id="prog-date" name="entry_date" type="date" required defaultValue={today} max={today} className="field" />
        </div>
        <div>
          <label htmlFor="prog-belt" className="label">
            Promoted to belt
          </label>
          <select id="prog-belt" name="belt_rank" defaultValue="" className="field capitalize">
            <option value="">No belt change</option>
            {BELTS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="prog-stripes" className="label">
            Stripes
          </label>
          <input
            id="prog-stripes"
            name="stripes"
            type="number"
            min={0}
            max={10}
            placeholder="No change"
            className="field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="prog-note" className="label">
          Note
        </label>
        <textarea
          id="prog-note"
          name="note"
          rows={3}
          placeholder="e.g. Great improvement on guard passing — keep working your hip escapes"
          className="field"
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
        <input type="checkbox" name="share" className="mt-0.5 size-4 accent-[var(--brand)]" />
        <span>
          <span className="font-semibold">Send this note to the member</span>
          <span className="block text-xs text-muted">
            They&apos;ll see it as coach feedback on their My Progress page. Leave unticked to keep it
            private to coaches.
          </span>
        </span>
      </label>
      <p className="text-xs text-muted">
        Choosing a belt or stripe count also updates the participant&apos;s current rank — promotions
        always show on the member&apos;s page.
      </p>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Add entry"}
      </button>
    </form>
  );
}
