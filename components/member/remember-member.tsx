"use client";

import { useEffect } from "react";
import { MEMBER_TOKEN_KEY } from "@/lib/member";

/** Remembers this member on this phone so /checkin and /progress can find them again. */
export function RememberMember({ token }: { token: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(MEMBER_TOKEN_KEY, token);
    } catch {
      // Storage blocked (private mode) — the personal link still works.
    }
  }, [token]);
  return null;
}
