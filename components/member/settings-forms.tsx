"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Avatar } from "@/components/avatar";
import type { MemberProfile } from "@/lib/member";

type State = { error?: string; ok?: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

function Message({ state }: { state: State }) {
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

const THEME_OPTIONS = [
  { value: "system", label: "Match my phone", hint: "Automatic" },
  { value: "light", label: "Light", hint: "White" },
  { value: "dark", label: "Dark", hint: "Black" },
] as const;

const ACCENT_OPTIONS = [
  { value: "red", label: "Red", swatch: "#c8202e" },
  { value: "blue", label: "Blue", swatch: "#2456b5" },
  { value: "mono", label: "Black & white", swatch: "linear-gradient(135deg,#111113 50%,#f6f6f7 50%)" },
] as const;

const OPTION =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm font-medium transition peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent hover:bg-foreground/5";

export function PhotoForm({
  action,
  name,
  photoUrl,
}: {
  action: Action;
  name: string;
  photoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="card space-y-4 p-6">
      <h2 className="text-lg font-bold">Profile photo</h2>
      <div className="flex items-center gap-4">
        <Avatar name={name} src={photoUrl} size={72} />
        <div className="min-w-0 flex-1">
          <label htmlFor="photo" className="sr-only">
            Choose a photo
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-brand-fg"
          />
          <p className="mt-1 text-xs text-muted">JPEG, PNG or WebP. It&apos;s resized automatically.</p>
        </div>
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? "Uploading…" : "Upload photo"}
      </button>
    </form>
  );
}

export function ProfileForm({ action, profile }: { action: Action; profile: MemberProfile }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);

  return (
    <form action={formAction} className="space-y-6">
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold">About you</h2>
        <div>
          <label htmlFor="nickname" className="label">
            Nickname
          </label>
          <input
            id="nickname"
            name="nickname"
            maxLength={40}
            defaultValue={profile.nickname ?? ""}
            placeholder={profile.full_name.split(" ")[0]}
            className="field"
          />
          <p className="mt-1 text-xs text-muted">This is how your page greets you.</p>
        </div>
        <div>
          <label htmlFor="bio" className="label">
            About me / my goals
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile.bio ?? ""}
            onChange={(e) => setBioLength(e.target.value.length)}
            placeholder="e.g. Earn my blue belt this year"
            className="field"
          />
          <p className="mt-1 text-right text-xs text-muted">{bioLength}/500</p>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold">Contact</h2>
          <p className="text-sm text-muted">Your coaches use these to reach you — for example to text a password reset.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="label">
              Mobile number
            </label>
            <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="0917 123 4567" className="field" />
          </div>
          <div>
            <label htmlFor="email" className="label">
              Email (optional)
            </label>
            <input id="email" name="email" type="email" defaultValue={profile.email ?? ""} className="field" />
          </div>
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">Appearance</h2>
        <fieldset>
          <legend className="label">Theme</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {THEME_OPTIONS.map((o) => (
              <div key={o.value}>
                <input
                  id={`theme-${o.value}`}
                  type="radio"
                  name="theme"
                  value={o.value}
                  defaultChecked={profile.theme === o.value}
                  className="peer sr-only"
                />
                <label htmlFor={`theme-${o.value}`} className={OPTION}>
                  <span>
                    {o.label}
                    <span className="block text-xs font-normal text-muted">{o.hint}</span>
                  </span>
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="label">Accent colour</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {ACCENT_OPTIONS.map((o) => (
              <div key={o.value}>
                <input
                  id={`accent-${o.value}`}
                  type="radio"
                  name="accent"
                  value={o.value}
                  defaultChecked={profile.accent === o.value}
                  className="peer sr-only"
                />
                <label htmlFor={`accent-${o.value}`} className={OPTION}>
                  <span className="size-5 shrink-0 rounded-full border border-border" style={{ background: o.swatch }} aria-hidden="true" />
                  {o.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="space-y-2">
        <Message state={state} />
        <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export function SecurityCard({ username }: { username: string | null }) {
  return (
    <section className="card space-y-3 p-6">
      <h2 className="text-lg font-bold">Sign-in</h2>
      <p className="text-sm">
        Username: <span className="font-mono font-semibold">{username ?? "—"}</span>
      </p>
      <Link href="/member/change-password" className="btn-secondary">
        Change password
      </Link>
      <p className="text-xs text-muted">Forgot it? Ask a coach at class — they can text you a temporary one.</p>
    </section>
  );
}
