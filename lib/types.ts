import type { Belt, ClassProgram, Program, Status } from "./constants";

export type StaffRole = "admin" | "coach";

export type StaffProfile = {
  user_id: string;
  full_name: string;
  role: StaffRole;
  phone: string | null;
  must_change_password: boolean;
};

export type Coach = {
  id: string;
  full_name: string;
  bio: string | null;
  belt_rank: string | null;
  photo_url: string | null;
  sort_order: number;
};

export type Participant = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_joined: string;
  belt_rank: Belt;
  stripes: number;
  program: Program[];
  status: Status;
  notes: string | null;
  photo_url: string | null;
  checkin_token: string;
  user_id: string | null;
  username: string | null;
  total_sessions: number;
  last_attended_on: string | null;
  created_at: string;
  updated_at: string;
};

export type ClassRow = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  coach_id: string | null;
  program: ClassProgram;
};

export type PublicScheduleRow = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  program: ClassProgram;
  coach_name: string | null;
};

export type AttendanceRow = {
  id: string;
  participant_id: string;
  class_id: string;
  session_date: string;
  checked_in_at: string;
  checked_in_by: string | null;
  check_in_method: "staff" | "qr";
};

export type ProgressionEntry = {
  id: string;
  participant_id: string;
  entry_date: string;
  belt_rank: Belt | null;
  stripes: number | null;
  note: string | null;
  visible_to_member: boolean;
  logged_by: string | null;
  created_at: string;
};
