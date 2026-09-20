// Runs every migration in an in-memory Postgres (PGlite) with stand-ins for Supabase's auth/storage
// schemas, then checks the behaviour that matters: triggers, member privacy (a member can never see
// coach-only notes or another member's data), anon lock-out, size functions and indexes.
//   npm run db:test
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFileSync } from "node:fs";

const ROOT = process.cwd();
const db = new PGlite({ extensions: { pg_trgm } });

// --- minimal stand-ins for the Supabase-provided schemas/roles/functions
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('test.role', true), ''), 'anon') $$;
  create schema extensions;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, created_at timestamptz default now(), metadata jsonb);
  alter table storage.objects enable row level security;
  -- what Supabase does by default for objects created in the public schema
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  grant usage on schema public, auth, extensions, storage to anon, authenticated, service_role;
`);

const files = ["0001_schema.sql", "0002_rls.sql", "0003_qr_checkin.sql", "0004_member_accounts_and_limits.sql"];
for (const f of files) {
  try {
    await db.exec(readFileSync(`${ROOT}/supabase/migrations/${f}`, "utf8"));
    console.log("OK   ", f);
  } catch (e) {
    console.log("FAIL ", f, "->", e.message);
    process.exit(1);
  }
}

// ------------------------------------------------------------------ behaviour checks
const q = async (sql, params) => (await db.query(sql, params)).rows;
let failures = 0;
const check = (name, cond, extra = "") => {
  if (!cond) failures++;
  console.log(cond ? "  pass" : "  FAIL", name, extra);
};
const asUser = async (uid, role = "authenticated") => {
  await db.exec(`reset role; set test.uid = '${uid ?? ""}'; set test.role = '${role}'; set role ${role === "service_role" ? "service_role" : role};`);
};
const asSuper = async () => db.exec(`reset role; set test.uid = ''; set test.role = '';`);

// seed
const admin = (await q(`insert into auth.users (email) values ('admin@x.com') returning id`))[0].id;
const coach = (await q(`insert into auth.users (email) values ('coach@x.com') returning id`))[0].id;
const memberUser = (await q(`insert into auth.users (email) values ('maria@members.sbg.local') returning id`))[0].id;
const otherUser = (await q(`insert into auth.users (email) values ('juan@members.sbg.local') returning id`))[0].id;
await q(`insert into public.staff_profiles (user_id, full_name, role) values ($1,'Admin','admin'), ($2,'Coach','coach')`, [admin, coach]);
const cls = (await q(`insert into public.classes (name, day_of_week, start_time, end_time, program) values ('BJJ',6,'09:00','10:30','BJJ') returning id`))[0].id;
await q(`insert into public.classes (name, day_of_week, start_time, end_time, program) values ('Striking',6,'10:30','12:00','Muay Thai & Kickboxing')`);
const maria = (await q(`insert into public.participants (full_name, phone, notes, user_id, username, program) values ('Maria Santos','09171234567','COACH ONLY: temper issues',$1,'maria.santos','{BJJ}') returning id`, [memberUser]))[0].id;
await q(`insert into public.participants (full_name, user_id, username) values ('Juan Cruz',$1,'juan.cruz')`, [otherUser]);
await q(`insert into public.member_settings (participant_id, must_change_password) values ($1, true)`, [maria]);

console.log("\nTriggers");
await q(`insert into public.attendance (participant_id, class_id, session_date, checked_in_by) values ($1,$2,'2026-09-05',$3), ($1,$2,'2026-09-12',$3)`, [maria, cls, admin]);
let p = (await q(`select total_sessions, last_attended_on::text d from public.participants where id=$1`, [maria]))[0];
check("attendance insert bumps counters", p.total_sessions === 2 && p.d === "2026-09-12", JSON.stringify(p));
await q(`delete from public.attendance where participant_id=$1 and session_date='2026-09-12'`, [maria]);
p = (await q(`select total_sessions, last_attended_on::text d from public.participants where id=$1`, [maria]))[0];
check("attendance delete (undo) recomputes counters", p.total_sessions === 1 && p.d === "2026-09-05", JSON.stringify(p));
await q(`insert into public.attendance (participant_id, class_id, session_date, checked_in_by) values ($1,$2,'2026-09-19',$3)`, [maria, cls, admin]);

const before = (await q(`select updated_at from public.participants where id=$1`, [maria]))[0].updated_at;
await db.exec(`select pg_sleep(0.05)`);
await q(`update public.participants set total_sessions = total_sessions + 0, last_attended_on = last_attended_on where id=$1`, [maria]);
const same = (await q(`select updated_at from public.participants where id=$1`, [maria]))[0].updated_at;
check("counter-only update does not touch updated_at", new Date(before).getTime() === new Date(same).getTime());
await q(`update public.participants set phone='09180000000' where id=$1`, [maria]);
const after = (await q(`select updated_at from public.participants where id=$1`, [maria]))[0].updated_at;
check("real edit does touch updated_at", new Date(after).getTime() > new Date(before).getTime());

await q(`insert into public.progression_log (participant_id, entry_date, belt_rank, stripes, note, visible_to_member, logged_by) values
  ($1,'2026-08-01','blue',0,'Congrats on blue!',true,$2),
  ($1,'2026-09-01',null,null,'PRIVATE: keep an eye on attitude',false,$2),
  ($1,'2026-09-10',null,null,'Great guard passing this month',true,$2),
  ($1,'2026-09-15',null,2,'Two stripes — private note',false,$2)`, [maria, coach]);
p = (await q(`select belt_rank, stripes from public.participants where id=$1`, [maria]))[0];
check("promotion trigger updates current belt/stripes", p.belt_rank === "blue" && p.stripes === 2, JSON.stringify(p));

await q(`insert into public.progression_log (participant_id, entry_date, belt_rank, stripes, logged_by) values ($1,'2026-01-01','white',0,$2)`, [maria, coach]);
p = (await q(`select belt_rank, stripes from public.participants where id=$1`, [maria]))[0];
check("back-dated entry does not override newer belt/stripes", p.belt_rank === "blue" && p.stripes === 2, JSON.stringify(p));
await q(`insert into public.progression_log (participant_id, entry_date, belt_rank, logged_by) values ($1,'2026-09-19','purple',$2)`, [maria, coach]);
p = (await q(`select belt_rank, stripes from public.participants where id=$1`, [maria]))[0];
check("newer promotion wins and resets stripes to 0", p.belt_rank === "purple" && p.stripes === 0, JSON.stringify(p));
await q(`update public.participants set belt_rank='blue', stripes=2 where id=$1`, [maria]);

console.log("\nMember functions (as Maria)");
await asUser(memberUser);
const prof = (await q(`select public.my_profile() as v`))[0].v;
check("my_profile returns own row", prof?.full_name === "Maria Santos" && prof.must_change_password === true);
check("my_profile hides coach notes + token", !("notes" in prof) && !("checkin_token" in prof) && !JSON.stringify(prof).includes("COACH ONLY"));
const prog = (await q(`select public.my_progress() as v`))[0].v;
check("my_progress totals", prog.total_sessions === 2, `total=${prog.total_sessions}`);
const notes = prog.timeline.map((t) => t.note);
check("timeline shows shared feedback", notes.includes("Great guard passing this month") && notes.includes("Congrats on blue!"));
check("timeline hides private notes", !JSON.stringify(prog).includes("PRIVATE") && !JSON.stringify(prog).includes("private note"));
check("timeline still shows the private-note promotion (stripes) without its note", prog.timeline.some((t) => t.stripes === 2 && t.note === null));
check("coach notes never leak", !JSON.stringify(prog).includes("COACH ONLY"));
await q(`select public.update_my_profile('Mia','Earn blue belt','09171112222','maria@mail.com','dark','blue')`);
const prof2 = (await q(`select public.my_profile() as v`))[0].v;
check("update_my_profile saves settings", prof2.nickname === "Mia" && prof2.theme === "dark" && prof2.accent === "blue" && prof2.phone === "09171112222");
try { await q(`select public.update_my_profile('x','y','','', 'neon','red')`); check("invalid theme rejected", false); }
catch { check("invalid theme rejected", true); }
try { await q(`select public.update_my_profile($1,'y','','','system','red')`, ["x".repeat(41)]); check("nickname length limit", false); }
catch { check("nickname length limit", true); }
await q(`select public.mark_password_changed()`);
check("mark_password_changed clears flag", (await q(`select public.my_profile() as v`))[0].v.must_change_password === false);
try { await q(`select * from public.participants`); check("member cannot read participants table", (await q(`select count(*)::int c from public.participants`))[0].c === 0); }
catch { check("member cannot read participants table", true); }
check("member cannot read member_settings", (await q(`select count(*)::int c from public.member_settings`))[0].c === 0);
check("member cannot read progression_log", (await q(`select count(*)::int c from public.progression_log`))[0].c === 0);
try { await q(`select public.usage_summary()`); check("member cannot call usage_summary", false); } catch { check("member cannot call usage_summary", true); }
try { await q(`select public.usage_bytes()`); check("member cannot call usage_bytes", false); } catch { check("member cannot call usage_bytes", true); }

console.log("\nIsolation (as Juan)");
await asUser(otherUser);
const juanProg = (await q(`select public.my_progress() as v`))[0].v;
check("other member sees only own data", juanProg.name === "Juan Cruz" && juanProg.total_sessions === 0 && juanProg.timeline.length === 0);

console.log("\nAnon");
await asUser(null, "anon");
try { await q(`select public.my_profile()`); check("anon cannot call my_profile", false); } catch { check("anon cannot call my_profile", true); }
try { await q(`select public.my_progress()`); check("anon cannot call my_progress", false); } catch { check("anon cannot call my_progress", true); }
try { await q(`select public.member_progress('00000000-0000-0000-0000-000000000000')`); check("token-based member_progress is gone", false); } catch { check("token-based member_progress is gone", true); }
try { await q(`select * from public.participants`); check("anon cannot read participants", false); } catch { check("anon cannot read participants", true); }
check("anon can read public_schedule view", (await q(`select count(*)::int c from public.public_schedule`))[0].c === 2);
await asSuper();
const tok = (await q(`select checkin_token t from public.participants where id=$1`, [maria]))[0].t;
await asUser(null, "anon");
const info = (await q(`select public.member_checkin_info($1) as v`, [tok]))[0].v;
check("QR check-in info still works for anon (name only)", info?.name === "Maria Santos" && !("belt_rank" in info));
check("anon has no privileges on new tables", await (async () => { try { await q(`select 1 from public.member_settings`); return false; } catch { return true; } })());
check("anon has no privileges on sms_log", await (async () => { try { await q(`select 1 from public.sms_log`); return false; } catch { return true; } })());

console.log("\nStaff");
await asUser(coach);
check("coach can read participants", (await q(`select count(*)::int c from public.participants`))[0].c === 2);
check("coach can read usage_bytes", typeof (await q(`select public.usage_bytes() as v`))[0].v !== "undefined");
try { await q(`select public.usage_summary()`); check("coach cannot call usage_summary (admin only)", false); } catch { check("coach cannot call usage_summary (admin only)", true); }
await asUser(admin);
const us = (await q(`select public.usage_summary() as v`))[0].v;
check("admin usage_summary works", typeof us.db_bytes === "number" && Array.isArray(us.tables) && us.tables.length > 5, `tables=${us.tables.length}`);

console.log("\nOrphaned photos + service role");
await asSuper();
await q(`insert into storage.objects (bucket_id, name, created_at, metadata) values
  ('participant-photos','${maria}/keep.webp', now() - interval '3 hours', '{"size":1000}'),
  ('participant-photos','${maria}/orphan.webp', now() - interval '3 hours', '{"size":5000}'),
  ('participant-photos','${maria}/fresh.webp', now(), '{"size":7000}')`);
await q(`update public.participants set photo_url='${maria}/keep.webp' where id=$1`, [maria]);
await asUser(admin);
const orph = await q(`select * from public.orphaned_photos()`);
check("orphaned_photos finds only the old unreferenced file", orph.length === 1 && orph[0].name.endsWith("orphan.webp"), JSON.stringify(orph.map((o) => o.name.slice(-12))));
await asUser(null, "service_role");
check("service role may call usage_bytes", Number((await q(`select public.usage_bytes() as v`))[0].v) > 0);

console.log("\nSMS log");
await asSuper();
await q(`insert into public.sms_log (purpose,target_kind,target_id,provider,status,created_at) values ('password_reset','member',$1,'manual','manual', now() - interval '120 days')`, [maria]);
await q(`insert into public.sms_log (purpose,target_kind,target_id,provider,status) values ('password_reset','member',$1,'manual','manual')`, [maria]);
check("sms_log trims rows older than 90 days", (await q(`select count(*)::int c from public.sms_log`))[0].c === 1);

console.log("\nIndexes");
const idx = (await q(`select indexname from pg_indexes where schemaname='public'`)).map((r) => r.indexname);
for (const name of ["participants_name_trgm_idx", "attendance_checked_in_at_idx", "progression_member_visible_idx", "classes_coach_idx", "participants_username_key", "sms_log_target_idx"]) {
  check(`index ${name}`, idx.includes(name));
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
