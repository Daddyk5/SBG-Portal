"use client";

import { useActionState } from "react";

type State = { error?: string } | undefined;

export function ChangePasswordForm({
  action,
  forced,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  forced?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {forced && (
        <p className="rounded-xl border border-border bg-foreground/5 p-3 text-sm">
          You signed in with a temporary password. Please choose your own to continue.
        </p>
      )}
      <div>
        <label htmlFor="password" className="label">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field"
        />
        <p className="mt-1 text-xs text-muted">At least 8 characters. A short sentence is easy to remember.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">
          Type it again
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="field"
        />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
