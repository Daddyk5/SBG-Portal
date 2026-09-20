-- Saved By Grace BJJ — core schema
-- Run in the Supabase SQL editor (or `supabase db push`). Safe to run once on a fresh project.

-- ---------------------------------------------------------------------------
-- Staff (coaches + admins who can log in to /admin and the future app)
-- ---------------------------------------------------------------------------
create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'coach' check (role in ('admin', 'coach')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Coaches (public bio cards — separate from staff logins)
-- ---------------------------------------------------------------------------
create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  bio text,
  belt_rank text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Participants (students / members)
-- ---------------------------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  date_joined date not null default current_date,
  -- Adult: white, blue, purple, brown, black. Youth: grey, yellow, orange, green.
  -- Coral / red are the senior black-belt degrees.
  belt_rank text not null default 'white' check (
    belt_rank in ('white', 'grey', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'coral', 'red')
  ),
  stripes int not null default 0 check (stripes between 0 and 10),
  program text[] not null default '{}' check (program <@ array['BJJ', 'Muay Thai', 'Kickboxing']),
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text,
  -- Storage object path inside the private `participant-photos` bucket (not a public URL).
  photo_url text,
  -- Secret used for QR self check-in. Never expose alongside other people's data.
  checkin_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);

create index participants_status_idx on public.participants (status);
create index participants_full_name_idx on public.participants (lower(full_name));

-- ---------------------------------------------------------------------------
-- Classes (weekly schedule)
-- ---------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  coach_id uuid references public.coaches(id) on delete set null,
  -- Muay Thai and Kickboxing are taught together in one session, so a class can serve both.
  program text not null check (program in ('BJJ', 'Muay Thai & Kickboxing', 'Muay Thai', 'Kickboxing')),
  check (end_time > start_time)
);

create index classes_day_idx on public.classes (day_of_week, start_time);

-- ---------------------------------------------------------------------------
-- Attendance (one row per participant per class session)
-- ---------------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  -- restrict: deleting a class must never silently erase its attendance history
  class_id uuid not null references public.classes(id) on delete restrict,
  session_date date not null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null, -- null for QR self check-in
  check_in_method text not null default 'staff' check (check_in_method in ('staff', 'qr')),
  unique (participant_id, class_id, session_date)
);

create index attendance_session_idx on public.attendance (class_id, session_date);
create index attendance_participant_idx on public.attendance (participant_id, session_date desc);

-- ---------------------------------------------------------------------------
-- Progression log (belt / stripe history + coach notes)
-- ---------------------------------------------------------------------------
create table public.progression_log (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  entry_date date not null default current_date,
  belt_rank text check (
    belt_rank in ('white', 'grey', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'coral', 'red')
  ),
  stripes int check (stripes between 0 and 10),
  note text,
  -- Feedback the coach chose to send to the member. Private notes stay hidden from them;
  -- promotions (belt / stripes) are always visible to the member.
  visible_to_member boolean not null default false,
  logged_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (belt_rank is not null or stripes is not null or note is not null)
);

create index progression_participant_idx on public.progression_log (participant_id, entry_date desc);

-- A promotion entry (belt and/or stripes) updates the participant's current rank,
-- unless a later-dated promotion already exists (so back-filling history is safe).
create function public.apply_progression()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.belt_rank is null and new.stripes is null then
    return new;
  end if;

  if exists (
    select 1 from public.progression_log p
    where p.participant_id = new.participant_id
      and p.id <> new.id
      and (p.belt_rank is not null or p.stripes is not null)
      and p.entry_date > new.entry_date
  ) then
    return new;
  end if;

  update public.participants
  set belt_rank = coalesce(new.belt_rank, belt_rank),
      -- a new belt with no stripe value starts at 0 stripes
      stripes = coalesce(new.stripes, case when new.belt_rank is not null then 0 else stripes end)
  where id = new.participant_id;

  return new;
end;
$$;

create trigger progression_log_apply
after insert on public.progression_log
for each row execute function public.apply_progression();
