"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CLASS_PROGRAMS, DAY_NAMES, DAYS_MONDAY_FIRST } from "@/lib/constants";
import type { ClassRow } from "@/lib/types";

type FormState = { error?: string } | undefined;
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function ClassForm({
  action,
  deleteAction,
  item,
  coaches,
}: {
  action: Action;
  deleteAction?: Action;
  item?: ClassRow;
  coaches: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [delState, delAction, deleting] = useActionState(deleteAction ?? (async () => undefined), undefined);

  return (
    <div className="space-y-4">
      <form action={formAction} className="card space-y-5 p-6">
        <div>
          <label htmlFor="name" className="label">
            Class name
          </label>
          <input id="name" name="name" required defaultValue={item?.name} placeholder="Fundamentals BJJ" className="field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="program" className="label">
              Program
            </label>
            <select id="program" name="program" required defaultValue={item?.program ?? "BJJ"} className="field">
              {CLASS_PROGRAMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="coach_id" className="label">
              Coach
            </label>
            <select id="coach_id" name="coach_id" defaultValue={item?.coach_id ?? ""} className="field">
              <option value="">No coach assigned</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="day_of_week" className="label">
              Day
            </label>
            <select id="day_of_week" name="day_of_week" required defaultValue={item?.day_of_week ?? 6} className="field">
              {DAYS_MONDAY_FIRST.map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start_time" className="label">
              Starts
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              required
              defaultValue={item?.start_time.slice(0, 5) ?? "18:00"}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="label">
              Ends
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              required
              defaultValue={item?.end_time.slice(0, 5) ?? "19:30"}
              className="field"
            />
          </div>
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : item ? "Save changes" : "Add class"}
          </button>
          <Link href="/admin/classes" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>

      {deleteAction && (
        <form
          action={delAction}
          onSubmit={(e) => {
            if (!confirm("Delete this class? This can't be undone.")) e.preventDefault();
          }}
          className="space-y-2"
        >
          {delState?.error && (
            <p role="alert" className="text-sm text-danger">
              {delState.error}
            </p>
          )}
          <button type="submit" disabled={deleting} className="btn-danger">
            {deleting ? "Deleting…" : "Delete class"}
          </button>
        </form>
      )}
    </div>
  );
}
