"use client";

import { useState } from "react";
import type { AccessResult } from "@/lib/account-tools";

/**
 * Shows the outcome of creating a login / resetting a password:
 *  - sent   -> "Texted to •••• 1234" (the password is NOT shown to the coach)
 *  - manual / failed -> the message to pass on, with Copy and "Open Messages" buttons
 */
export function AccessResultNotice({ result }: { result: AccessResult }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  if (result.error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {result.error}
      </p>
    );
  }

  const d = result.delivery;
  return (
    <div role="status" className="space-y-3 rounded-xl border border-border bg-foreground/5 p-4 text-sm">
      {result.done && <p className="font-semibold text-success">{result.done}</p>}
      {result.username && (
        <p>
          Username: <span className="font-mono font-semibold">{result.username}</span>
        </p>
      )}

      {d?.status === "sent" && (
        <p>
          ✉ A text with the temporary password was sent to <span className="font-semibold">{d.to}</span>. They must
          choose their own password when they sign in.
        </p>
      )}

      {d && d.status !== "sent" && (
        <div className="space-y-2">
          <p className="font-semibold">
            {d.status === "failed"
              ? "The text could not be sent — pass this message on yourself:"
              : "Text messaging isn't connected — send this message yourself:"}
          </p>
          {d.note && <p className="text-muted">{d.note}</p>}
          <textarea readOnly rows={4} value={d.message} className="field font-mono text-xs" aria-label="Message to send" />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(d.message ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard blocked — the text is selectable above */
                }
              }}
            >
              {copied ? "Copied ✓" : "Copy message"}
            </button>
            {d.smsLink && (
              <a href={d.smsLink} className="btn-primary">
                Open Messages app
              </a>
            )}
          </div>
          <p className="text-xs text-muted">This is shown once. It contains a temporary password — don&apos;t post it anywhere public.</p>
        </div>
      )}
    </div>
  );
}
