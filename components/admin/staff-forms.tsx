"use client";

import { useActionState, useState, useTransition } from "react";
import { AccessResultNotice } from "@/components/admin/access-result";
import type { AccessResult } from "@/lib/account-tools";

type WithData = (prev: AccessResult, formData: FormData) => Promise<AccessResult>;
type Bare = (prev: AccessResult) => Promise<AccessResult>;

export function AddStaffForm({ action }: { action: WithData }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="card space-y-4 p-5">
      <h2 className="text-lg font-bold">Add a coach or admin</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="s-name" className="label">
            Full name
          </label>
          <input id="s-name" name="full_name" required className="field" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="s-email" className="label">
            Email (their sign-in)
          </label>
          <input id="s-email" name="email" type="email" required className="field" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="s-role" className="label">
            Role
          </label>
          <select id="s-role" name="role" defaultValue="coach" className="field">
            <option value="coach">Coach — check-in and notes</option>
            <option value="admin">Admin — everything</option>
          </select>
        </div>
        <div>
          <label htmlFor="s-phone" className="label">
            Mobile number (for texts)
          </label>
          <input id="s-phone" name="phone" type="tel" placeholder="0917 123 4567" className="field" autoComplete="off" />
        </div>
      </div>
      <p className="text-xs text-muted">
        They&apos;ll receive a temporary password by text and must choose their own the first time they sign in.
      </p>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Adding…" : "Add & text password"}
      </button>
      <AccessResultNotice result={state} />
    </form>
  );
}

export function StaffRow({
  name,
  email,
  role,
  phone,
  isSelf,
  updatePhone,
  reset,
  remove,
}: {
  name: string;
  email: string | null;
  role: string;
  phone: string | null;
  isSelf: boolean;
  updatePhone: WithData;
  reset: Bare;
  remove: () => Promise<AccessResult>;
}) {
  const [phoneState, phoneAction, savingPhone] = useActionState(updatePhone, undefined);
  const [resetState, resetAction, resetting] = useActionState(reset, undefined);
  const [removing, startRemove] = useTransition();
  const [removeState, setRemoveState] = useState<AccessResult>(undefined);

  return (
    <li className="space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {name} {isSelf && <span className="text-xs font-normal text-muted">(you)</span>}
          </p>
          <p className="text-sm text-muted">{email ?? "email hidden"}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            role === "admin" ? "bg-brand/15 text-brand-text" : "bg-accent/15 text-accent"
          }`}
        >
          {role}
        </span>
      </div>

      <form action={phoneAction} className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor={`phone-${email ?? name}`} className="label">
            Mobile number
          </label>
          <input
            id={`phone-${email ?? name}`}
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            placeholder="0917 123 4567"
            className="field"
          />
        </div>
        <button type="submit" disabled={savingPhone} className="btn-secondary">
          {savingPhone ? "Saving…" : "Save number"}
        </button>
      </form>
      {phoneState?.error && (
        <p role="alert" className="text-sm text-danger">
          {phoneState.error}
        </p>
      )}
      {phoneState?.done && (
        <p role="status" className="text-sm text-success">
          {phoneState.done}
        </p>
      )}

      {!isSelf && (
        <div className="flex flex-wrap gap-2">
          <form
            action={resetAction}
            onSubmit={(e) => {
              if (!confirm(`Reset ${name}'s password and text them a new temporary one?`)) e.preventDefault();
            }}
          >
            <button type="submit" disabled={resetting} className="btn-secondary">
              {resetting ? "Sending…" : "Forgot password? Reset & text"}
            </button>
          </form>
          <button
            type="button"
            disabled={removing}
            className="btn-danger"
            onClick={() => {
              if (!confirm(`Remove ${name}'s access? They will no longer be able to sign in.`)) return;
              startRemove(async () => setRemoveState(await remove()));
            }}
          >
            {removing ? "Removing…" : "Remove access"}
          </button>
        </div>
      )}
      <AccessResultNotice result={resetState ?? removeState} />
    </li>
  );
}
