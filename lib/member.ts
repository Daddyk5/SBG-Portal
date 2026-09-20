import type { Belt } from "./constants";

/** localStorage key that remembers which member a phone belongs to (see /m and /checkin). */
export const MEMBER_TOKEN_KEY = "sbg_member_token";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shape returned by the `my_profile` SQL function (supabase/migrations/0004). */
export type MemberProfile = {
  participant_id: string;
  full_name: string;
  username: string | null;
  nickname: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  theme: "system" | "light" | "dark";
  accent: "red" | "blue" | "mono";
  belt_rank: Belt;
  stripes: number;
  photo_path: string | null;
  must_change_password: boolean;
};

/** Shape returned by the `my_progress` SQL function (supabase/migrations/0004). */
export type MemberProgress = {
  name: string;
  belt_rank: Belt;
  stripes: number;
  date_joined: string;
  programs: string[];
  today: string;
  total_sessions: number;
  sessions_30d: number;
  attendance_dates: string[];
  recent_sessions: { date: string; class_name: string }[];
  timeline: {
    entry_date: string;
    belt_rank: Belt | null;
    stripes: number | null;
    /** true when the coach chose to send this note to the member */
    feedback: boolean;
    note: string | null;
  }[];
};
