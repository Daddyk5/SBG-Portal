import "server-only";
import { last4, maskPhone, normalizePhone } from "@/lib/phone";
import { manualSmsLink, sendSms, smsProviderName } from "@/lib/sms";
import { SITE } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/** What the admin UI shows after creating a login or resetting a password. */
export type Delivery = {
  status: "sent" | "failed" | "manual";
  /** masked number, e.g. "•••• 4567" */
  to?: string;
  /** Only present when the text did NOT go out, so the coach can pass it on themselves. */
  message?: string;
  smsLink?: string;
  note?: string;
};

export type AccessResult =
  | {
      error?: string;
      done?: string;
      username?: string;
      delivery?: Delivery;
    }
  | undefined;

export function credentialsMessage(opts: {
  name: string;
  login: string;
  loginLabel: "username" | "email";
  password: string;
  area: "member" | "admin";
  reset: boolean;
}): string {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  const url = `${SITE.url}/${opts.area}/login`;
  return `Saved By Grace BJJ: Hi ${first}, ${
    opts.reset ? "your password was reset." : "your login is ready."
  } ${opts.loginLabel === "username" ? "Username" : "Email"}: ${opts.login} | Temporary password: ${opts.password} | Sign in at ${url} and choose your own password.`;
}

/**
 * Texts the credentials (or prepares a manual text) and records WHO/WHEN in sms_log.
 * The message itself contains a password, so it is never stored or logged.
 */
export async function deliverCredentials(opts: {
  targetKind: "member" | "staff";
  targetId: string;
  purpose: "password_reset" | "account_created";
  phone: string | null | undefined;
  message: string;
  createdBy: string;
}): Promise<Delivery> {
  const admin = createAdminClient();
  const { e164, error: phoneError } = normalizePhone(opts.phone ?? "");

  let delivery: Delivery;
  let provider: string = smsProviderName();
  let status: "sent" | "failed" | "manual" = "manual";
  let logError: string | null = null;

  if (!e164) {
    // No usable number: give the coach the text to pass on by other means.
    delivery = { status: "manual", message: opts.message, note: phoneError };
    logError = phoneError ?? null;
  } else {
    const result = await sendSms(e164, opts.message);
    provider = result.provider;
    status = result.status;
    logError = result.error ?? null;
    if (result.status === "sent") {
      delivery = { status: "sent", to: maskPhone(e164) };
    } else if (result.status === "failed") {
      delivery = {
        status: "failed",
        to: maskPhone(e164),
        message: opts.message,
        smsLink: manualSmsLink(e164, opts.message),
        note: "The text message service returned an error, so nothing was sent.",
      };
    } else {
      delivery = {
        status: "manual",
        to: maskPhone(e164),
        message: opts.message,
        smsLink: manualSmsLink(e164, opts.message),
      };
    }
  }

  const { error } = await admin.from("sms_log").insert({
    purpose: opts.purpose,
    target_kind: opts.targetKind,
    target_id: opts.targetId,
    phone_last4: e164 ? last4(e164) : null,
    provider,
    status,
    error: logError ? logError.slice(0, 300) : null,
    created_by: opts.createdBy,
  });
  if (error) console.error("sms_log insert failed:", error.message);

  return delivery;
}

/** true if a reset text for this person was already sent in the last 2 minutes. */
export async function resetTooSoon(targetId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 2 * 60_000).toISOString();
  const { count } = await admin
    .from("sms_log")
    .select("id", { count: "exact", head: true })
    .eq("target_id", targetId)
    .eq("purpose", "password_reset")
    .gte("created_at", since);
  return (count ?? 0) > 0;
}
