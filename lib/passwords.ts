import "server-only";
import { randomInt } from "node:crypto";

// No 0/O/1/l/I so a temporary password read out of a text message can't be misread.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/** A random one-time password (10 chars, ~58 bits). Shown/texted once, never stored. */
export function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** "María José Santos" -> "maria.santos" (lowercase letters/digits, 3–30 chars). */
export function suggestUsername(fullName: string): string {
  const words = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  let base = words.length >= 2 ? `${words[0]}.${words[words.length - 1]}` : (words[0] ?? "member");
  if (base.length < 3) base = `${base}member`;
  return base.slice(0, 26);
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
