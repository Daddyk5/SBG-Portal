/** Default country calling code for numbers typed without one. 63 = Philippines. */
const DEFAULT_CC = (process.env.SMS_DEFAULT_COUNTRY_CODE ?? "63").replace(/\D/g, "");

/**
 * Turns what a person typed into international format (+639171234567).
 * Accepts 09171234567, 9171234567, 639171234567, +63 917 123 4567, 0063…
 */
export function normalizePhone(input: string): { e164?: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return { error: "No phone number on file." };

  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = DEFAULT_CC + digits.slice(1);
  } else if (!digits.startsWith(DEFAULT_CC) || digits.length <= 10) {
    digits = DEFAULT_CC + digits;
  }

  if (digits.length < 8 || digits.length > 15) {
    return { error: "That phone number doesn't look right." };
  }
  return { e164: `+${digits}` };
}

/** "+639171234567" -> "•••• 4567" (never show or log full numbers unnecessarily). */
export function maskPhone(e164: string): string {
  return `•••• ${e164.slice(-4)}`;
}

export const last4 = (e164: string) => e164.slice(-4);
