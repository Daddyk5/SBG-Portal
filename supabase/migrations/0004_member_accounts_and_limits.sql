-- Saved By Grace BJJ — member accounts, progress backend, SMS log, size guards
--
-- What this adds
--   * Members can have a login (username + password) and read ONLY their own progress,
--     through SECURITY DEFINER functions (never the tables directly, so coach-only notes
--     stay private).
--   * Profile settings a member can customise (nickname, goals, theme, accent colour).
--   * Counters + triggers that keep attendance totals current, and updated_at stamps.
--   * Indexes for every query the app runs (recent activity, search, foreign keys).
--   * An SMS log (for password-reset texts) that trims itself after 90 days.
--   * Size guards so the project stays under the 5 GB budget: length limits on text,
--     smaller photo limits, and functions to measure usage and find unused photos.
--
-- Replaces the token-based progress function from 0003 — progress now needs a login.

drop function if exists public.member_progress(uuid);

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger. Ignores counter-only changes so that an attendance
-- check-in does not look like the profile was edited.
-- ---------------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'updated_at' - 'total_sessions' - 'last_attended_on')
     is distinct from
     (to_jsonb(old) - 'updated_at' - 'total_sessions' - 'last_attended_on') then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- participants: login link, attendance counters, updated_at, length limit
-- ---------------------------------------------------------------------------
alter table public.participants
  add column user_id uuid unique references auth.users(id) on delete set null,
  add column username text,
  add column total_sessions int not null default 0,
  add column last_attended_on date,
  add column updated_at timestamptz not null default now(),
  add constraint participants_username_format check (username is null or username ~ '^[a-z0-9._-]{3,30}$'),
  add constraint participants_notes_len check (notes is null or char_length(notes) <= 2000);

create unique index participants_username_key on public.participants (lower(username)) where username is not null;
-- Fast "%name%" search in the admin list
create index participants_name_trgm_idx on public.participants using gin (full_name extensions.gin_trgm_ops);
-- "Haven't been seen in a while" style queries
create index participants_last_attended_idx on public.participants (last_attended_on) where status = 'active';

create trigger participants_touch
before update on public.participants
for each row execute function public.touch_updated_at();

-- Backfill counters for any attendance that already exists
update public.participants p
set total_sessions = s.n, last_attended_on = s.d
from (
  select participant_id, count(*) as n, max(session_date) as d
  from public.attendance group by participant_id
) s
where s.participant_id = p.id;

-- Keep the counters current on every check-in / undo
create function public.attendance_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.participants
    set total_sessions = total_sessions + 1,
        last_attended_on = greatest(coalesce(last_attended_on, new.session_date), new.session_date)
    where id = new.participant_id;
  elsif tg_op = 'DELETE' then
    update public.participants
    set total_sessions = greatest(total_sessions - 1, 0),
        last_attended_on = (
          select max(a.session_date) from public.attendance a where a.participant_id = old.participant_id
        )
    where id = old.participant_id;
  end if;
  return null;
end;
$$;

create trigger attendance_counters_trg
after insert or delete on public.attendance
for each row execute function public.attendance_counters();

revoke execute on function public.attendance_counters() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Promotion trigger, made independent of insert order.
-- Each field is applied only if no LATER entry supersedes it:
--   belt    <- a new belt, unless a later entry also sets a belt
--   stripes <- the new stripe count (or 0 for a new belt with none), unless a later
--              entry sets stripes or a belt
-- So back-filling history, or inserting several rows in one statement, always ends with
-- the participant on their most recent belt and stripe count.
-- ---------------------------------------------------------------------------
create or replace function public.apply_progression()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.belt_rank is not null and not exists (
    select 1 from public.progression_log p
    where p.participant_id = new.participant_id
      and p.id <> new.id
      and p.belt_rank is not null
      and (p.entry_date, p.created_at) > (new.entry_date, new.created_at)
  ) then
    update public.participants set belt_rank = new.belt_rank where id = new.participant_id;
  end if;

  if (new.belt_rank is not null or new.stripes is not null) and not exists (
    select 1 from public.progression_log p
    where p.participant_id = new.participant_id
      and p.id <> new.id
      and (p.belt_rank is not null or p.stripes is not null)
      and (p.entry_date, p.created_at) > (new.entry_date, new.created_at)
  ) then
    update public.participants set stripes = coalesce(new.stripes, 0) where id = new.participant_id;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- progression_log: updated_at, length limit, indexes
-- ---------------------------------------------------------------------------
alter table public.progression_log
  add column updated_at timestamptz not null default now(),
  add constraint progression_note_len check (note is null or char_length(note) <= 2000);

create trigger progression_touch
before update on public.progression_log
for each row execute function public.touch_updated_at();

-- Dashboard "recent progress" and "recent check-ins"
create index progression_created_at_idx on public.progression_log (created_at desc);
create index attendance_checked_in_at_idx on public.attendance (checked_in_at desc);
-- Dashboard "check-ins today"
create index attendance_session_date_idx on public.attendance (session_date);
-- What a member may see: promotions + shared feedback only
create index progression_member_visible_idx
  on public.progression_log (participant_id, entry_date desc, created_at desc)
  where belt_rank is not null or stripes is not null or visible_to_member;

-- Foreign-key indexes (deletes and joins stay fast as data grows)
create index classes_coach_idx on public.classes (coach_id);
create index attendance_checked_in_by_idx on public.attendance (checked_in_by);
create index progression_logged_by_idx on public.progression_log (logged_by);

-- ---------------------------------------------------------------------------
-- Member settings (profile customisation). Members reach this only through the
-- my_* functions below; staff can read it.
-- ---------------------------------------------------------------------------
create table public.member_settings (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  nickname text check (nickname is null or char_length(nickname) between 1 and 40),
  bio text check (bio is null or char_length(bio) <= 500),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  accent text not null default 'red' check (accent in ('red', 'blue', 'mono')),
  -- true after an admin/coach resets the password: the member must choose their own
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger member_settings_touch
before update on public.member_settings
for each row execute function public.touch_updated_at();

-- The public site has no access to any table: keep it that way for new tables too.
revoke all on public.member_settings from anon;
alter default privileges in schema public revoke all on tables from anon;

alter table public.member_settings enable row level security;
create policy "member_settings staff read" on public.member_settings
  for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- staff_profiles: phone (for password-reset texts) + forced password change
-- ---------------------------------------------------------------------------
alter table public.staff_profiles
  add column phone text check (phone is null or char_length(phone) <= 20),
  add column must_change_password boolean not null default false,
  add column updated_at timestamptz not null default now();

create trigger staff_profiles_touch
before update on public.staff_profiles
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Member-facing functions. They identify the caller by auth.uid() and return only
-- what a member is allowed to see. Coach-only notes (participants.notes and private
-- progression notes) are never included.
-- ---------------------------------------------------------------------------
create function public.my_profile()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'participant_id', p.id,
    'full_name', p.full_name,
    'username', p.username,
    'nickname', s.nickname,
    'bio', s.bio,
    'phone', p.phone,
    'email', p.email,
    'theme', coalesce(s.theme, 'system'),
    'accent', coalesce(s.accent, 'red'),
    'belt_rank', p.belt_rank,
    'stripes', p.stripes,
    'photo_path', p.photo_url,
    'must_change_password', coalesce(s.must_change_password, false)
  )
  from public.participants p
  left join public.member_settings s on s.participant_id = p.id
  where p.user_id = (select auth.uid()) and p.status = 'active';
$$;

create function public.my_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_p public.participants;
  v_today date := public.gym_now()::date;
begin
  select * into v_p from public.participants
  where user_id = (select auth.uid()) and status = 'active';
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'name', v_p.full_name,
    'belt_rank', v_p.belt_rank,
    'stripes', v_p.stripes,
    'date_joined', v_p.date_joined,
    'programs', to_jsonb(v_p.program),
    'today', v_today,
    'total_sessions', v_p.total_sessions,
    'sessions_30d', (
      select count(*) from public.attendance a
      where a.participant_id = v_p.id and a.session_date > v_today - 30
    ),
    'attendance_dates', coalesce((
      select jsonb_agg(a.session_date order by a.session_date)
      from public.attendance a
      where a.participant_id = v_p.id and a.session_date > v_today - 190
    ), '[]'::jsonb),
    'recent_sessions', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', s.session_date, 'class_name', s.name)
        order by s.session_date desc, s.checked_in_at desc
      )
      from (
        select a.session_date, a.checked_in_at, c.name
        from public.attendance a
        join public.classes c on c.id = a.class_id
        where a.participant_id = v_p.id
        order by a.session_date desc, a.checked_in_at desc
        limit 20
      ) s
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'entry_date', e.entry_date,
          'belt_rank', e.belt_rank,
          'stripes', e.stripes,
          'feedback', e.visible_to_member,
          'note', case when e.visible_to_member then e.note end
        )
        order by e.entry_date desc, e.created_at desc
      )
      from (
        select * from public.progression_log l
        where l.participant_id = v_p.id
          and (l.belt_rank is not null or l.stripes is not null or l.visible_to_member)
        order by l.entry_date desc, l.created_at desc
        limit 100
      ) e
    ), '[]'::jsonb)
  );
end;
$$;

-- Members edit their own profile here. Length/format limits are enforced by the
-- table constraints, so bad input raises an error instead of being stored.
create function public.update_my_profile(
  p_nickname text,
  p_bio text,
  p_phone text,
  p_email text,
  p_theme text,
  p_accent text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.participants
  where user_id = (select auth.uid()) and status = 'active';
  if v_id is null then
    raise exception 'No member profile for this account' using errcode = '42501';
  end if;

  insert into public.member_settings (participant_id, nickname, bio, theme, accent)
  values (v_id, nullif(btrim(p_nickname), ''), nullif(btrim(p_bio), ''), p_theme, p_accent)
  on conflict (participant_id) do update
    set nickname = excluded.nickname,
        bio = excluded.bio,
        theme = excluded.theme,
        accent = excluded.accent;

  update public.participants
  set phone = nullif(btrim(p_phone), ''),
      email = nullif(btrim(p_email), '')
  where id = v_id;
end;
$$;

create function public.mark_password_changed()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.member_settings s
  set must_change_password = false
  from public.participants p
  where p.id = s.participant_id and p.user_id = (select auth.uid());
$$;

revoke execute on function public.my_profile(), public.my_progress(),
  public.update_my_profile(text, text, text, text, text, text), public.mark_password_changed()
  from public, anon;
grant execute on function public.my_profile(), public.my_progress(),
  public.update_my_profile(text, text, text, text, text, text), public.mark_password_changed()
  to authenticated;

-- ---------------------------------------------------------------------------
-- SMS log (password-reset texts). Stores WHO/WHEN/outcome only — never the message
-- (it contains a temporary password) and only the last 4 digits of the number.
-- A statement trigger trims rows older than 90 days so it can never grow unbounded.
-- ---------------------------------------------------------------------------
create table public.sms_log (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('password_reset', 'account_created')),
  target_kind text not null check (target_kind in ('member', 'staff')),
  target_id uuid not null,
  phone_last4 text,
  provider text not null,
  status text not null check (status in ('sent', 'failed', 'manual')),
  error text check (error is null or char_length(error) <= 300),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index sms_log_target_idx on public.sms_log (target_id, created_at desc);
create index sms_log_created_idx on public.sms_log (created_at);
create index sms_log_created_by_idx on public.sms_log (created_by);

revoke all on public.sms_log from anon;
alter table public.sms_log enable row level security;
create policy "sms_log admin read" on public.sms_log
  for select to authenticated using (public.is_admin());

create function public.purge_old_sms_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.sms_log where created_at < now() - interval '90 days';
  return null;
end;
$$;

create trigger sms_log_purge
after insert on public.sms_log
for each statement execute function public.purge_old_sms_log();

revoke execute on function public.purge_old_sms_log() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Size guards (keep the project under the 5 GB budget)
-- ---------------------------------------------------------------------------

-- Photos are compressed by the app before upload, so real files are small. This is a
-- hard ceiling in case anything bypasses the app.
update storage.buckets
set file_size_limit = 2097152
where id in ('coach-photos', 'participant-photos');

-- Total bytes used by the database + all stored files. Staff (and the server itself,
-- for member photo uploads) may call it; the app checks it before accepting a photo.
create function public.usage_bytes()
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() and (select auth.role()) is distinct from 'service_role' then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return pg_database_size(current_database())
    + coalesce((select sum((o.metadata ->> 'size')::bigint) from storage.objects o), 0);
end;
$$;

-- Admin-only breakdown for the Usage page.
create function public.usage_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'storage_bytes', coalesce((select sum((o.metadata ->> 'size')::bigint) from storage.objects o), 0),
    'buckets', coalesce((
      select jsonb_agg(jsonb_build_object('bucket', b.bucket_id, 'files', b.files, 'bytes', b.bytes)
                       order by b.bytes desc)
      from (
        select o.bucket_id, count(*) as files, coalesce(sum((o.metadata ->> 'size')::bigint), 0) as bytes
        from storage.objects o group by o.bucket_id
      ) b
    ), '[]'::jsonb),
    'tables', coalesce((
      select jsonb_agg(jsonb_build_object('name', t.relname, 'bytes', t.bytes, 'rows', t.rows)
                       order by t.bytes desc)
      from (
        select c.relname,
               pg_total_relation_size(c.oid) as bytes,
               greatest(c.reltuples, 0)::bigint as rows
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

-- Photos nobody points at any more (left behind by replaced/removed photos).
-- Objects younger than an hour are ignored so an upload in progress is never touched.
create function public.orphaned_photos()
returns table (bucket_id text, name text, size bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  return query
  select o.bucket_id, o.name, coalesce((o.metadata ->> 'size')::bigint, 0)
  from storage.objects o
  where o.created_at < now() - interval '1 hour'
    and (
      (o.bucket_id = 'participant-photos'
        and not exists (select 1 from public.participants p where p.photo_url = o.name))
      or
      (o.bucket_id = 'coach-photos'
        and not exists (select 1 from public.coaches c where c.photo_url like ('%/' || o.name)))
    );
end;
$$;

revoke execute on function public.usage_bytes(), public.usage_summary(), public.orphaned_photos()
  from public, anon;
grant execute on function public.usage_bytes(), public.usage_summary(), public.orphaned_photos()
  to authenticated;
