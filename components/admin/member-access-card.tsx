"use client";

import { useActionState } from "react";
import { AccessResultNotice } from "@/components/admin/access-result";
import type { AccessResult } from "@/lib/account-tools";

type Create = (prev: AccessResult, formData: FormData) => Promise<AccessResult>;
type Reset = (prev: AccessResult) => Promise<AccessResult>;

/** Profile card: give a member a login, or "forgot password → text a reset". */
export function MemberAccessCard({
  hasLogin,
  username,
  suggestedUsername,
  hasPhone,
  create,
  reset,
}: {
  hasLogin: boolean;
  username: string | null;
  suggestedUsername: string;
  hasPhone: boolean;
  create: Create;
  reset: Reset;
}) {
  const [createState, createAction, creating] = useActionState(create, undefined);
  const [resetState, resetAction, resetting] = useActionState(reset, undefined);
  // Once created in this session, treat as having a login (the page also revalidates).
  const loggedIn = hasLogin || Boolean(createState && !createState.error && createState.username);

  return (
    <section className="card space-y-4 p-5" aria-labelledby="access-heading">
      <h2 id="access-heading" className="text-lg font-bold">
        Member login
      </h2>

      {!hasPhone && (
        <p className="rounded-xl border border-border bg-foreground/5 p-3 text-xs text-muted">
          No phone number on file, so the password can&apos;t be texted. You&apos;ll be given the message to pass on
          yourself. (Admins can add a number under Edit.)
        </p>
      )}

      {!loggedIn ? (
        <form action={createAction} className="space-y-3">
          <div>
            <label htmlFor="username" className="label">
              Username
            </label>
            <input
              id="username"
              name="username"
              defaultValue=""
              placeholder={suggestedUsername}
              autoComplete="off"
              autoCapitalize="none"
              className="field"
            />
            <p className="mt-1 text-xs text-muted">
              Leave blank to use <span className="font-mono">{suggestedUsername}</span>. They&apos;ll get a temporary
              password by text and must choose their own.
            </p>
          </div>
          <button type="submit" disabled={creating} className="btn-primary w-full">
            {creating ? "Creating…" : "Create login & text password"}
          </button>
          <AccessResultNotice result={createState} />
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            Username: <span className="font-mono font-semibold">{username ?? createState?.username}</span>
          </p>
          <form
            action={resetAction}
            onSubmit={(e) => {
              if (!confirm("Reset this member's password and text them a new temporary one?")) e.preventDefault();
            }}
          >
            <button type="submit" disabled={resetting} className="btn-secondary w-full">
              {resetting ? "Sending…" : "Forgot password? Reset & text"}
            </button>
          </form>
          <AccessResultNotice result={resetState ?? (createState?.username ? createState : undefined)} />
        </div>
      )}
    </section>
  );
}
