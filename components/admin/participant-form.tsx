"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BELTS, PROGRAMS, STATUSES } from "@/lib/constants";
import type { Participant } from "@/lib/types";

type FormState = { error?: string; ok?: string } | undefined;

export function ParticipantForm({
  action,
  participant,
  cancelHref,
  returnTo,
  canSetStatus = true,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  participant?: Participant;
  cancelHref: string;
  returnTo?: string;
  canSetStatus?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="card space-y-5 p-6">
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <div>
        <label htmlFor="full_name" className="label">
          Full name <span aria-hidden="true">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={participant?.full_name}
          className="field"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" defaultValue={participant?.email ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" defaultValue={participant?.phone ?? ""} className="field" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="belt_rank" className="label">
            Belt
          </label>
          <select id="belt_rank" name="belt_rank" defaultValue={participant?.belt_rank ?? "white"} className="field capitalize">
            {BELTS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stripes" className="label">
            Stripes
          </label>
          <input
            id="stripes"
            name="stripes"
            type="number"
            min={0}
            max={10}
            defaultValue={participant?.stripes ?? 0}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="date_joined" className="label">
            Date joined
          </label>
          <input
            id="date_joined"
            name="date_joined"
            type="date"
            required
            defaultValue={participant?.date_joined ?? today}
            className="field"
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Programs</legend>
        <div className="flex flex-wrap gap-3">
          {PROGRAMS.map((p) => (
            <label key={p} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3">
              <input
                type="checkbox"
                name="program"
                value={p}
                defaultChecked={participant?.program.includes(p) ?? p === "BJJ"}
                className="size-4 accent-[var(--brand)]"
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      {canSetStatus ? (
        <div className="sm:max-w-xs">
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" defaultValue={participant?.status ?? "active"} className="field capitalize">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="status" value="active" />
      )}

      <div>
        <label htmlFor="notes" className="label">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} defaultValue={participant?.notes ?? ""} className="field" />
      </div>

      <div>
        <label htmlFor="photo" className="label">
          Photo {participant?.photo_url && <span className="font-normal text-muted">(uploading replaces the current one)</span>}
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-brand-fg"
        />
        <p className="mt-1 text-xs text-muted">JPEG, PNG or WebP, up to 5 MB.</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : participant ? "Save changes" : "Add participant"}
        </button>
        <Link href={cancelHref} className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
