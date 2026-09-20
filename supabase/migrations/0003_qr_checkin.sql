-- Saved By Grace BJJ — QR self check-in (personal link) — NOTE: the token-based
-- member_progress() defined at the bottom is replaced by login-based my_progress() in 0004.
--
-- Flow: each member has a secret personal link (participants.checkin_token), delivered
-- as a QR code from their profile. Opening it once stores the token on their phone.
-- A QR posted at the gym door then opens /checkin, which reads that stored token and
-- lets the member tap today's class. The same token opens the member's "My Progress"
-- page. These functions are the ONLY way the anon role can touch member data; the
-- secret token is the credential.

-- Today's date / time in the gym's timezone
create function public.gym_now()
returns timestamp
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Manila'); $$;

-- Returns null if the token is unknown or the member is inactive.
create function public.member_checkin_info(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_participant public.participants;
  v_now timestamp := public.gym_now();
  v_classes jsonb;
begin
  select * into v_participant from public.participants
  where checkin_token = p_token and status = 'active';
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'program', c.program,
    'start_time', c.start_time,
    'end_time', c.end_time,
    'coach_name', co.full_name,
    'open', v_now::time >= c.start_time - interval '60 minutes' and v_now::time <= c.end_time,
    'checked_in', exists (
      select 1 from public.attendance a
      where a.participant_id = v_participant.id
        and a.class_id = c.id
        and a.session_date = v_now::date
    )
  ) order by c.start_time), '[]'::jsonb)
  into v_classes
  from public.classes c
  left join public.coaches co on co.id = c.coach_id
  where c.day_of_week = extract(dow from v_now)::int;

  return jsonb_build_object('name', v_participant.full_name, 'classes', v_classes);
end;
$$;

-- status: ok | already | closed | invalid
create function public.member_check_in(p_token uuid, p_class_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant public.participants;
  v_class public.classes;
  v_now timestamp := public.gym_now();
  v_inserted int;
begin
  select * into v_participant from public.participants
  where checkin_token = p_token and status = 'active';
  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_class from public.classes where id = p_class_id;
  if not found
     or v_class.day_of_week <> extract(dow from v_now)::int
     or v_now::time < v_class.start_time - interval '60 minutes'
     or v_now::time > v_class.end_time then
    return jsonb_build_object('status', 'closed');
  end if;

  insert into public.attendance (participant_id, class_id, session_date, check_in_method)
  values (v_participant.id, v_class.id, v_now::date, 'qr')
  on conflict (participant_id, class_id, session_date) do nothing;
  get diagnostics v_inserted = row_count;

  return jsonb_build_object(
    'status', case when v_inserted = 1 then 'ok' else 'already' end,
    'name', v_participant.full_name
  );
end;
$$;

revoke execute on function public.member_checkin_info(uuid), public.member_check_in(uuid, uuid)
  from public;
grant execute on function public.member_checkin_info(uuid), public.member_check_in(uuid, uuid)
  to anon, authenticated;


-- ---------------------------------------------------------------------------
-- My Progress: what a member may see about themselves.
-- Returns null for an unknown / inactive token. Private coach notes are NOT returned:
-- a timeline entry is included only if it is a promotion or was marked "share with
-- member", and its note text is included only when shared.
-- ---------------------------------------------------------------------------
create function public.member_progress(p_token uuid)
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
  where checkin_token = p_token and status = 'active';
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
    'total_sessions', (
      select count(*) from public.attendance a where a.participant_id = v_p.id
    ),
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

revoke execute on function public.member_progress(uuid) from public;
grant execute on function public.member_progress(uuid) to anon, authenticated;
