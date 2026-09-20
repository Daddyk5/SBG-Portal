# Database reference

Everything lives in one Supabase project (Postgres + Auth + Storage). The schema is defined entirely by the SQL files in `supabase/migrations/`, which are the source of truth — this page explains them.

- `0001_schema.sql` — tables, constraints, indexes, the promotion trigger
- `0002_rls.sql` — role helpers, Row Level Security policies, public views, storage buckets
- `0003_qr_checkin.sql` — the functions behind QR self check-in
- `0004_member_accounts_and_limits.sql` — member logins and settings, the progress functions, counters/triggers/indexes, the SMS log, and the size guards

`supabase/setup.sql` is all of them joined into one paste-able file (regenerate with `npm run db:bundle`). Apply them with `npm run db:migrate`. `npm run db:test` runs them all in an in-memory Postgres and checks the behaviour described below.

## Tables

```
auth.users ──< staff_profiles          (who may use /admin, and their role)

coaches ──< classes ──< attendance >── participants ──< progression_log
```

### `staff_profiles`
Staff logins. One row per person who may sign in to `/admin` (and, later, the mobile app).

| Column | Notes |
|---|---|
| `user_id` | Primary key; the Supabase Auth user. Deleted with the user. |
| `full_name` | Shown in the admin header. |
| `role` | `admin` or `coach` (default `coach`). |
| `phone` | International format (`+63…`). Where password-reset texts are sent. |
| `must_change_password` | `true` after a reset: they must choose their own password at next sign-in. |
| `updated_at` | Maintained by a trigger. |

### `coaches`
Public coach bios shown on `/coaches`. **Not the same thing as staff logins** — a coach can have a bio without a login and vice versa.

| Column | Notes |
|---|---|
| `full_name`, `bio`, `belt_rank` | Free text; `belt_rank` is optional. |
| `photo_url` | Full public URL in the `coach-photos` bucket. |
| `sort_order` | Lower appears first on the website. |

### `participants`
Students and members.

| Column | Notes |
|---|---|
| `full_name` | Required. |
| `email`, `phone` | Optional. `phone` is where texts go; members can update both in Settings. |
| `notes` | **Coach-only** notes (≤ 2,000 characters). Never visible to the member. |
| `date_joined` | Defaults to today. |
| `belt_rank` | One of the 11 ranks below. Default `white`. |
| `stripes` | 0–10. |
| `program` | Array of `BJJ`, `Muay Thai`, `Kickboxing` (may be empty). |
| `status` | `active` or `inactive`. Inactive members are hidden from check-in lists and can't use QR check-in or sign in. |
| `photo_url` | A **storage path** in the private `participant-photos` bucket (not a URL). Turned into a temporary signed link when displayed. |
| `checkin_token` | A secret random UUID for QR check-in. Treat like a password. |
| `user_id` | The member's login (Supabase Auth user), or `null` if they don't have one. |
| `username` | Their sign-in name (lowercase letters, digits `. _ -`, 3–30 chars, unique). |
| `total_sessions`, `last_attended_on` | Kept current **automatically** by a trigger on `attendance` — don't edit by hand. |
| `updated_at` | Maintained by a trigger (ignores counter-only changes). |

**Belt ranks** (allowed values, enforced by the database): `white`, `grey`, `yellow`, `orange`, `green` (youth), `blue`, `purple`, `brown`, `black`, `coral`, `red`.

### `member_settings`
A member's profile customisation. One row per member who has a login. Members never touch this table directly (they use `update_my_profile`); staff can read it.

| Column | Notes |
|---|---|
| `participant_id` | Primary key → `participants`. |
| `nickname` | ≤ 40 characters. |
| `bio` | "About me / goals", ≤ 500 characters. |
| `theme` | `system`, `light` or `dark`. |
| `accent` | `red`, `blue` or `mono` (black & white). |
| `must_change_password` | `true` after a reset, until they choose their own. |

### `sms_log`
One row per password-reset / account text: who it was for, when, provider, and `sent` / `failed` / `manual`. It stores **only the last 4 digits** of the number and **never the message** (which contains a temporary password). Admin-readable. Rows older than 90 days are deleted automatically.

### `classes`
The weekly schedule, shown on `/schedule`.

| Column | Notes |
|---|---|
| `name` | e.g. "Fundamentals BJJ". |
| `day_of_week` | 0–6, **0 = Sunday**. |
| `start_time`, `end_time` | Must satisfy end > start. Local gym time (no timezone stored). |
| `coach_id` | Optional; becomes `null` if the coach is deleted. |
| `program` | `BJJ`, `Muay Thai & Kickboxing`, `Muay Thai` or `Kickboxing`. The gym teaches **Muay Thai and Kickboxing together as one class**, so that has its own combined value. Participants are still enrolled in the individual programs (`participants.program`); the check-in screen's "only show … students" filter treats a combined class as serving both. |

### `attendance`
One row per participant per class session.

| Column | Notes |
|---|---|
| `participant_id`, `class_id` | Deleting a participant removes their attendance. **Deleting a class that has attendance is blocked** so history can't be erased by accident. |
| `session_date` | The date of the session (gym date). |
| `checked_in_at` | When the row was created. |
| `checked_in_by` | The staff user who recorded it; `null` for QR self check-ins. |
| `check_in_method` | `staff` or `qr`. |
| — | `unique (participant_id, class_id, session_date)` — a member can only be checked in once per session; repeats are ignored. |

### `progression_log`
Belt/stripe history and coach notes.

| Column | Notes |
|---|---|
| `entry_date` | Defaults to today; can be backdated. |
| `belt_rank`, `stripes` | Optional. Set when the entry is a promotion. |
| `note` | Optional free text. |
| `visible_to_member` | `false` by default. When a coach ticks **Send this note to the member**, it becomes `true` and the note appears as "Coach feedback" on the member's My Progress page. Promotions (belt/stripes) are always visible to the member. |
| `logged_by` | The staff user who wrote it. |
| — | At least one of belt, stripes or note is required. |

**Promotion trigger:** when an entry with a belt and/or stripe count is inserted, the database automatically updates the participant's current `belt_rank`/`stripes` — *unless* a later-dated promotion already exists for that participant (so backfilling old history does not overwrite their current rank). A new belt with no stripe count resets stripes to 0.

## Access rules (Row Level Security)

RLS is enabled on every table. It is the real security boundary — the app's own checks are an extra layer, not a substitute.

There are four kinds of caller:

- **anon** — the public website (anyone, no login)
- **member** — signed in, linked to a participant via `participants.user_id`
- **coach** — signed in, with a `staff_profiles` row of role `coach`
- **admin** — signed in, role `admin`

| | anon | member | coach | admin |
|---|---|---|---|---|
| `public_schedule`, `public_coaches` (views) | read | read | read | read |
| `participants` | — | — (see functions below) | read, **insert** (walk-ins) | read, insert, update, delete |
| `attendance` | — | — | read, insert, delete (undo) | read, insert, delete |
| `progression_log` | — | — | read, insert | read, insert, update, delete |
| `member_settings` | — | — | read | read |
| `classes`, `coaches` | — | — | read | read, insert, update, delete |
| `staff_profiles` | — | — | read **own row** | read all, insert, update, delete |
| `sms_log` | — | — | — | read |

Details worth knowing:

- **Members have no access to any table.** They reach their own data only through the `my_*` functions below, which return their own row and nothing else — so `participants.notes` and private progression notes can never be read by a member.
- Inserts into `attendance` and `progression_log` must set `checked_in_by` / `logged_by` to the caller's own user id, so entries can't be attributed to someone else.
- Signing in alone grants nothing: every staff policy checks for a `staff_profiles` row, via `is_staff()` / `is_admin()`.
- The anon role has **no** direct access to any table — all table privileges are revoked from it, including for tables created in future.
- Creating logins and resetting passwords use the server-side **secret key** (which bypasses RLS) — only from Server Actions, after the caller's role has been checked.

## Public views

The public website needs the schedule and coach bios but must not touch the base tables. Two views expose only safe columns and are readable by anon:

- `public_schedule` — class name, day, times, program, and the coach's **name** (joined from `coaches`)
- `public_coaches` — id, name, bio, belt, photo, sort order

The views run with their owner's privileges (`security_invoker = false`) on purpose, so they bypass table RLS but only ever return these columns. Supabase's linter may flag "security definer view" — that is intentional here. **Do not add columns to these views without thinking about whether they should be public.**

## Functions

| Function | Who can call | Purpose |
|---|---|---|
| `is_staff()`, `is_admin()` | signed-in users | Used inside RLS policies. |
| `member_checkin_info(token)` | anon | Name + today's classes for a QR link, or `null` for an unknown/inactive token. |
| `member_check_in(token, class_id)` | anon | Records a QR check-in. Returns `ok`, `already`, `closed` or `invalid`. |
| `my_profile()` | signed-in | The caller's **own** member profile + settings (no coach notes, no token), or `null` if they aren't an active member. |
| `my_progress()` | signed-in | The caller's own belt, attendance stats and dates, recent classes and timeline. A timeline entry appears only if it is a **promotion** or was marked *send to member*, and its note text only when sent. |
| `update_my_profile(...)` | signed-in | A member saves their nickname, bio, phone, email, theme and accent. Invalid values are rejected by table constraints. |
| `mark_password_changed()` | signed-in | Clears the caller's "must change password" flag. |
| `usage_bytes()` | staff (and the server) | Total bytes used by database + files. Checked before photo uploads. |
| `usage_summary()` | admin | Breakdown for the Usage page. |
| `orphaned_photos()` | admin | Photo files nothing points at (older than an hour). |
| `apply_progression()`, `attendance_counters()`, `purge_old_sms_log()`, `touch_updated_at()` | nobody directly | Trigger functions (see below). |
| `gym_now()` | internal | Current time in `Asia/Manila`. |

**QR check-in rules:** the member's token identifies them; the class must run **today** (Manila time) and check-in is open from **60 minutes before the start until the end** of the class. To change the window, edit the `interval '60 minutes'` in both QR functions via a new migration.

If a member's QR link is shared by mistake, issue them a new token (their old link stops working immediately):

```sql
update public.participants set checkin_token = gen_random_uuid() where id = '<participant id>';
```

The QR token now only allows **checking in** — it no longer opens progress, which requires a login.

## Triggers

| Trigger | On | What it does |
|---|---|---|
| `progression_log_apply` | insert on `progression_log` | When an entry has a belt and/or stripes, updates the participant's current rank. **Order-independent:** a belt only applies if no *later* entry sets a belt, stripes only if no later entry sets stripes or a belt — so back-filling old history never overwrites a newer promotion, and a new belt with no stripe count resets stripes to 0. |
| `attendance_counters_trg` | insert/delete on `attendance` | Keeps `participants.total_sessions` and `last_attended_on` correct, including when a check-in is undone. |
| `*_touch` | update on `participants`, `progression_log`, `member_settings`, `staff_profiles` | Sets `updated_at` (ignoring counter-only changes). |
| `sms_log_purge` | insert on `sms_log` | Deletes log rows older than 90 days. |

## Indexes

Every query the app runs is backed by an index: name search (a trigram index, so `%maria%` is fast), recent check-ins and recent progress on the dashboard, today's check-in count, a member's visible timeline (a partial index over promotions and shared notes), unique usernames, and every foreign key (`classes.coach_id`, `attendance.checked_in_by`, `progression_log.logged_by`, …). See the migrations for the full list.

## Storage

| Bucket | Visibility | Who can write | Contents |
|---|---|---|---|
| `coach-photos` | **Public** (anyone with the link) | Admins | Coach photos shown on the website |
| `participant-photos` | **Private** | Staff upload; admins replace/delete; members via the server | Member photos, shown via short-lived signed URLs (1 hour) |

Photos are compressed to ≤1024 px WebP by the app before upload, and each bucket refuses any file over **2 MB**. Participant photos are private because members may be minors. See [data-limits.md](data-limits.md).

## Changing the schema

**Never edit a migration that has already been applied.** Add a new file, e.g. `supabase/migrations/0004_short_description.sql`, and run it in the SQL editor. Keep the numbering sequential.

### Example: change the belt list

The list is enforced in the database and mirrored in code, so change both:

1. New migration (constraint names below are the defaults Postgres generated):

   ```sql
   alter table public.participants drop constraint participants_belt_rank_check;
   alter table public.participants add constraint participants_belt_rank_check
     check (belt_rank in ('white', 'blue', 'purple', 'brown', 'black'));

   alter table public.progression_log drop constraint progression_log_belt_rank_check;
   alter table public.progression_log add constraint progression_log_belt_rank_check
     check (belt_rank in ('white', 'blue', 'purple', 'brown', 'black'));
   ```

   (Existing rows using a removed belt must be updated first or the statement fails.)
2. Update `BELTS` and `BELT_COLORS` in `lib/constants.ts`.

### Example: add a program

Programs are also checked in two places: the `participants.program` and `classes.program` constraints in SQL, and `PROGRAMS` / `CLASS_PROGRAMS` in `lib/constants.ts`. Update both the same way. The wording on `/programs` is in `app/(public)/programs/page.tsx`.
