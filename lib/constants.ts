export const BELTS = [
  "white",
  "grey",
  "yellow",
  "orange",
  "green",
  "blue",
  "purple",
  "brown",
  "black",
  "coral",
  "red",
] as const;
export type Belt = (typeof BELTS)[number];

export const PROGRAMS = ["BJJ", "Muay Thai", "Kickboxing"] as const;
export type Program = (typeof PROGRAMS)[number];

/**
 * What a *class* can be. Muay Thai and Kickboxing are taught together in a single Saturday
 * session, so there is a combined option; participants are still enrolled in the individual
 * PROGRAMS above.
 */
export const COMBINED_STRIKING = "Muay Thai & Kickboxing" as const;
export const CLASS_PROGRAMS = ["BJJ", COMBINED_STRIKING, "Muay Thai", "Kickboxing"] as const;
export type ClassProgram = (typeof CLASS_PROGRAMS)[number];

export const STATUSES = ["active", "inactive"] as const;
export type Status = (typeof STATUSES)[number];

/** day_of_week: 0 = Sunday. The public schedule displays Monday first. */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export const DAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

/** Swatch colours for belt badges. */
export const BELT_COLORS: Record<Belt, { bg: string; fg: string; border: string }> = {
  white: { bg: "#f8fafc", fg: "#0f172a", border: "#cbd5e1" },
  grey: { bg: "#9ca3af", fg: "#0f172a", border: "#6b7280" },
  yellow: { bg: "#facc15", fg: "#422006", border: "#ca8a04" },
  orange: { bg: "#fb923c", fg: "#431407", border: "#c2410c" },
  green: { bg: "#22c55e", fg: "#052e16", border: "#15803d" },
  blue: { bg: "#2563eb", fg: "#ffffff", border: "#1e40af" },
  purple: { bg: "#7e22ce", fg: "#ffffff", border: "#581c87" },
  brown: { bg: "#78350f", fg: "#ffffff", border: "#451a03" },
  black: { bg: "#111827", fg: "#ffffff", border: "#000000" },
  coral: { bg: "#f87171", fg: "#450a0a", border: "#b91c1c" },
  red: { bg: "#dc2626", fg: "#ffffff", border: "#7f1d1d" },
};

export const GYM_TIMEZONE = "Asia/Manila";

export function isBelt(value: unknown): value is Belt {
  return typeof value === "string" && (BELTS as readonly string[]).includes(value);
}

export function isProgram(value: unknown): value is Program {
  return typeof value === "string" && (PROGRAMS as readonly string[]).includes(value);
}

export function isClassProgram(value: unknown): value is ClassProgram {
  return typeof value === "string" && (CLASS_PROGRAMS as readonly string[]).includes(value);
}

/** Which participant enrolments a class serves (used to filter the check-in list). */
export function programsServedBy(classProgram: string): Program[] {
  if (classProgram === COMBINED_STRIKING) return ["Muay Thai", "Kickboxing"];
  return isProgram(classProgram) ? [classProgram] : [];
}

/** "18:30:00" -> "6:30 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Today's date (YYYY-MM-DD) and weekday (0 = Sunday) in the gym's timezone. */
export function gymToday(now = new Date()): { date: string; dow: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { date: `${get("year")}-${get("month")}-${get("day")}`, dow };
}

/** Format a YYYY-MM-DD date string for display without timezone drift. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
