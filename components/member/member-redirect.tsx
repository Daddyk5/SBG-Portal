"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { MEMBER_TOKEN_KEY, UUID_RE } from "@/lib/member";

function readToken(): string | null {
  try {
    return localStorage.getItem(MEMBER_TOKEN_KEY);
  } catch {
    return null; // Storage unavailable — fall through to the help message.
  }
}

// The token never changes while this page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

const COPY = {
  "check-in": { path: "", busy: "Checking you in…", title: "Set up your check-in" },
} as const;

/**
 * Sends a member to their personal page using the token saved on this phone,
 * or explains how to get set up if the phone doesn't know them yet.
 */
export function MemberRedirect({ to }: { to: keyof typeof COPY }) {
  const router = useRouter();
  const copy = COPY[to];
  // undefined on the server / first render, then the stored token (or null) on the client.
  const stored = useSyncExternalStore<string | null | undefined>(subscribe, readToken, () => undefined);
  const token = stored && UUID_RE.test(stored) ? stored : null;

  useEffect(() => {
    if (token) router.replace(`/m/${token}${copy.path}`);
  }, [token, router, copy.path]);

  if (stored === undefined || token) {
    return (
      <p role="status" className="flex items-center gap-3 text-muted">
        <span className="size-4 animate-spin rounded-full border-2 border-border border-t-brand" aria-hidden="true" />
        {copy.busy}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">{copy.title}</h2>
      <p className="text-muted">
        This phone doesn&apos;t know who you are yet. Ask a coach for your personal QR code and scan it
        once — after that, the door QR at the gym will take you straight to today&apos;s classes.
      </p>
    </div>
  );
}
