"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BELTS } from "@/lib/constants";
import type { Coach } from "@/lib/types";

type FormState = { error?: string } | undefined;
type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function CoachForm({
  action,
  deleteAction,
  coach,
}: {
  action: Action;
  deleteAction?: Action;
  coach?: Coach;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [delState, delAction, deleting] = useActionState(deleteAction ?? (async () => undefined), undefined);

  return (
    <div className="space-y-4">
      <form action={formAction} className="card space-y-5 p-6">
        <div>
          <label htmlFor="full_name" className="label">
            Full name
          </label>
          <input id="full_name" name="full_name" required defaultValue={coach?.full_name} className="field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="belt_rank" className="label">
              Belt
            </label>
            <select id="belt_rank" name="belt_rank" defaultValue={coach?.belt_rank ?? ""} className="field capitalize">
              <option value="">Not shown</option>
              {BELTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort_order" className="label">
              Display order
            </label>
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={coach?.sort_order ?? 0}
              className="field"
            />
            <p className="mt-1 text-xs text-muted">Lower numbers appear first on the website.</p>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="label">
            Bio
          </label>
          <textarea id="bio" name="bio" rows={5} defaultValue={coach?.bio ?? ""} className="field" />
        </div>

        <div>
          <label htmlFor="photo" className="label">
            Photo
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-brand-fg"
          />
          <p className="mt-1 text-xs text-muted">
            JPEG, PNG or WebP, up to 5 MB. This photo is public on the website.
          </p>
          {coach?.photo_url && (
            <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name="remove_photo" className="size-4 accent-[var(--brand)]" />
              Remove current photo
            </label>
          )}
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "Saving…" : coach ? "Save changes" : "Add coach"}
          </button>
          <Link href="/admin/coaches" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>

      {deleteAction && (
        <form
          action={delAction}
          onSubmit={(e) => {
            if (!confirm("Delete this coach? Their classes will become unassigned.")) e.preventDefault();
          }}
          className="space-y-2"
        >
          {delState?.error && (
            <p role="alert" className="text-sm text-danger">
              {delState.error}
            </p>
          )}
          <button type="submit" disabled={deleting} className="btn-danger">
            {deleting ? "Deleting…" : "Delete coach"}
          </button>
        </form>
      )}
    </div>
  );
}
