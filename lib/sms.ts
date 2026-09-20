import "server-only";

/**
 * Sends a text message.
 *
 * Provider is chosen by SMS_PROVIDER:
 *   - "semaphore" (Philippines) — needs SEMAPHORE_API_KEY, optional SEMAPHORE_SENDER_NAME
 *   - "twilio"                  — needs TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
 *   - unset                     — "manual" mode: nothing is sent; we return an sms: link and the
 *                                 message so the coach can send it from their own phone.
 *
 * Message bodies contain temporary passwords, so callers must not store them.
 */
export type SmsResult = {
  status: "sent" | "failed" | "manual";
  provider: "semaphore" | "twilio" | "manual";
  error?: string;
};

export function smsProviderName(): SmsResult["provider"] {
  const p = (process.env.SMS_PROVIDER ?? "").toLowerCase();
  if (p === "semaphore" && process.env.SEMAPHORE_API_KEY) return "semaphore";
  if (p === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) {
    return "twilio";
  }
  return "manual";
}

/** A link that opens the phone's Messages app with the text pre-filled (works on iOS and Android). */
export function manualSmsLink(e164: string | undefined, message: string): string {
  return `sms:${e164 ?? ""}?&body=${encodeURIComponent(message)}`;
}

async function readError(res: Response): Promise<string> {
  try {
    const text = (await res.text()).slice(0, 200);
    return `${res.status} ${text}`.trim();
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function sendSms(e164: string, message: string): Promise<SmsResult> {
  const provider = smsProviderName();

  try {
    if (provider === "semaphore") {
      const body = new URLSearchParams({
        apikey: process.env.SEMAPHORE_API_KEY!,
        number: e164.replace("+", ""),
        message,
      });
      if (process.env.SEMAPHORE_SENDER_NAME) body.set("sendername", process.env.SEMAPHORE_SENDER_NAME);
      const res = await fetch("https://api.semaphore.co/api/v4/messages", { method: "POST", body });
      if (!res.ok) return { status: "failed", provider, error: await readError(res) };
      return { status: "sent", provider };
    }

    if (provider === "twilio") {
      const sid = process.env.TWILIO_ACCOUNT_SID!;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}` },
        body: new URLSearchParams({ To: e164, From: process.env.TWILIO_FROM!, Body: message }),
      });
      if (!res.ok) return { status: "failed", provider, error: await readError(res) };
      return { status: "sent", provider };
    }
  } catch (e) {
    return { status: "failed", provider, error: e instanceof Error ? e.message : "Network error" };
  }

  return { status: "manual", provider: "manual" };
}
