"use client";

import { useActionState } from "react";
import type { CleanupResult } from "./actions";

export function CleanupButton({ action }: { action: (prev: CleanupResult) => Promise<CleanupResult> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-2">
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Checking…" : "Clean up unused photos"}
      </button>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.done && (
        <p role="status" className="text-sm text-success">
          {state.done}
        </p>
      )}
    </form>
  );
}
