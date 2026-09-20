-- Saved By Grace BJJ — Row Level Security, public views, storage
--
-- Access model
--   anon (public site)  : NO access to any table. Reads two curated views only
--                         (public_schedule, public_coaches).
--   coach               : read everything; insert participants (walk-ins), attendance,
--                         progression entries; delete attendance (undo a check-in).
--   admin               : everything a coach can do + manage participants, classes,
--                         coaches, staff profiles, and edit/delete progression entries.

-- ---------------------------------------------------------------------------
-- Role helpers (security definer so policies on staff_profiles don't recurse)
-- ---------------------------------------------------------------------------
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_profiles where user_id = (select auth.uid()));
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_staff(), public.is_admin() from public, anon;
grant execute on function public.is_staff(), public.is_admin() to authenticated;
revoke execute on function public.apply_progression() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lock everything down, then open up explicitly
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;

alter table public.staff_profiles enable row level security;
alter table public.coaches enable row level security;
alter table public.participants enable row level security;
alter table public.classes enable row level security;
alter table public.attendance enable row level security;
alter table public.progression_log enable row level security;

-- staff_profiles: you can read your own row (the app needs your role); admins manage all
create policy "staff_profiles read own or admin" on public.staff_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "staff_profiles admin insert" on public.staff_profiles
  for insert to authenticated with check (public.is_admin());
create policy "staff_profiles admin update" on public.staff_profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff_profiles admin delete" on public.staff_profiles
  for delete to authenticated using (public.is_admin());

-- coaches
create policy "coaches staff read" on public.coaches
  for select to authenticated using (public.is_staff());
create policy "coaches admin insert" on public.coaches
  for insert to authenticated with check (public.is_admin());
create policy "coaches admin update" on public.coaches
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "coaches admin delete" on public.coaches
  for delete to authenticated using (public.is_admin());

-- classes
create policy "classes staff read" on public.classes
  for select to authenticated using (public.is_staff());
create policy "classes admin insert" on public.classes
  for insert to authenticated with check (public.is_admin());
create policy "classes admin update" on public.classes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "classes admin delete" on public.classes
  for delete to authenticated using (public.is_admin());

-- participants (coaches may add walk-ins but only admins edit / delete)
create policy "participants staff read" on public.participants
  for select to authenticated using (public.is_staff());
create policy "participants staff insert" on public.participants
  for insert to authenticated with check (public.is_staff());
create policy "participants admin update" on public.participants
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "participants admin delete" on public.participants
  for delete to authenticated using (public.is_admin());

-- attendance
create policy "attendance staff read" on public.attendance
  for select to authenticated using (public.is_staff());
create policy "attendance staff insert" on public.attendance
  for insert to authenticated
  with check (public.is_staff() and checked_in_by = (select auth.uid()));
create policy "attendance staff delete" on public.attendance
  for delete to authenticated using (public.is_staff());

-- progression_log
create policy "progression staff read" on public.progression_log
  for select to authenticated using (public.is_staff());
create policy "progression staff insert" on public.progression_log
  for insert to authenticated
  with check (public.is_staff() and logged_by = (select auth.uid()));
create policy "progression admin update" on public.progression_log
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "progression admin delete" on public.progression_log
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Public views (the ONLY thing the anon key can read)
-- Owned by postgres, so they bypass table RLS on purpose and expose only
-- non-sensitive columns.
-- ---------------------------------------------------------------------------
create view public.public_coaches with (security_invoker = false) as
  select id, full_name, bio, belt_rank, photo_url, sort_order
  from public.coaches;

create view public.public_schedule with (security_invoker = false) as
  select c.id, c.name, c.day_of_week, c.start_time, c.end_time, c.program,
         co.full_name as coach_name
  from public.classes c
  left join public.coaches co on co.id = c.coach_id;

grant select on public.public_coaches, public.public_schedule to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage
--   coach-photos       public bucket (shown on the website); admins upload
--   participant-photos private bucket (members may be minors); staff only, via signed URLs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('coach-photos', 'coach-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('participant-photos', 'participant-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "coach-photos staff read" on storage.objects
  for select to authenticated using (bucket_id = 'coach-photos' and public.is_staff());
create policy "coach-photos admin write" on storage.objects
  for insert to authenticated with check (bucket_id = 'coach-photos' and public.is_admin());
create policy "coach-photos admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'coach-photos' and public.is_admin())
  with check (bucket_id = 'coach-photos' and public.is_admin());
create policy "coach-photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'coach-photos' and public.is_admin());

create policy "participant-photos staff read" on storage.objects
  for select to authenticated using (bucket_id = 'participant-photos' and public.is_staff());
create policy "participant-photos staff write" on storage.objects
  for insert to authenticated with check (bucket_id = 'participant-photos' and public.is_staff());
create policy "participant-photos admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'participant-photos' and public.is_admin())
  with check (bucket_id = 'participant-photos' and public.is_admin());
create policy "participant-photos admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'participant-photos' and public.is_admin());
