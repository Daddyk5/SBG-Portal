# Setup and deployment

How to go from an empty Supabase project to a working, live site. Do the steps in order.

## 1. Create the Supabase project

Create a project at [supabase.com](https://supabase.com). Note the **Project URL** and the **publishable key** (`sb_publishable_…`, under Project Settings → API Keys; older projects call it the *anon* key). Both are safe to expose in the browser — the database's Row Level Security is what protects the data (see [database.md](database.md#access-rules-row-level-security)). The **secret** key (`sb_secret_…`) is different: it bypasses all access rules. This project uses it **only on the server** (for creating logins and password resets — see [accounts-and-sms.md](accounts-and-sms.md)); keep it in a server environment variable, never `NEXT_PUBLIC_`, and never commit or share it.

## 2. Set up the database

The database is defined by the numbered files in `supabase/migrations/` (`0001` … `0004`). Pick **one** way to apply them:

**A. One command (recommended)** — needs your database connection string:

1. Supabase dashboard → **Connect** → **Session pooler** → copy the connection string and put your database password in it.
2. Add it to `.env.local` as `SUPABASE_DB_URL=postgres://postgres.xxxx:PASSWORD@aws-0-….pooler.supabase.com:5432/postgres` (it's a secret; `.env.local` is git-ignored).
3. Run `npm run db:migrate`. It applies anything new, in order, each file in its own transaction (a failing file changes nothing), and remembers what has run. `npm run db:migrate -- --status` shows what's applied.

**B. One paste** — no password needed: open **SQL Editor → New query**, paste the whole of **`supabase/setup.sql`** (all four migrations joined), press **Run**, once, on a fresh project. Afterwards run `npm run db:migrate -- --baseline` (if you later use option A) so it knows those files are already applied.

Either way you should see *Success*, and **Table Editor** should list `participants`, `classes`, `coaches`, `attendance`, `progression_log`, `staff_profiles`, `member_settings` and `sms_log`.

Until this is done the public Schedule and Coaches pages show "coming soon" and the server prints a warning (*"database not set up yet"*) — expected, not a bug.

`setup.sql` is generated from the migrations (`npm run db:bundle`); the migrations are the source of truth. Want to check the SQL without touching Supabase? `npm run db:test` runs everything in a throwaway in-memory Postgres.

Then add your class times: in the admin go to **Classes** and add the two Saturday classes (BJJ, and Muay Thai & Kickboxing). See the [admin guide](admin-guide.md#classes-admins).

## 3. Turn off public sign-ups

Authentication → Sign In / Providers → **disable "Allow new users to sign up"**.

Staff accounts are created by an admin in the dashboard, not by visitors. Even with sign-ups on, a stranger's account cannot read anything (access requires a staff row — see step 4), but there is no reason to leave it open.

## 4. Create the first admin

1. Authentication → Users → **Add user** → enter an email and password (tick *Auto confirm user*).
2. In the SQL Editor, give that user the admin role:

   ```sql
   insert into public.staff_profiles (user_id, full_name, role)
   select id, 'Your Name', 'admin'
   from auth.users
   where email = 'you@example.com';
   ```

After that you can add everyone else from **Admin → Staff** (no more SQL) — they're texted a temporary password. If you'd rather use SQL, repeat the above for each coach using `'coach'` as the role. To change someone's role later:

```sql
update public.staff_profiles set role = 'admin'
where user_id = (select id from auth.users where email = 'coach@example.com');
```

To remove someone's access, delete their `staff_profiles` row (and, ideally, their user in Authentication → Users).

An account that can sign in but has **no** `staff_profiles` row is rejected at login with "doesn't have staff access".

## 5. Configure environment variables

Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-only (needed for creating logins / password resets / member photos)
SUPABASE_SECRET_KEY=<secret key>
```

See `.env.example` for every option (SMS provider, size budget, database URL for migrations).

Restart `npm run dev` after changing them. `NEXT_PUBLIC_*` values are baked in at build time, so in production they must be set **before** building.

## 6. Run it locally and check

```bash
npm install
npm run dev
```

- Open `http://localhost:3000/admin` and sign in.
- Add a coach, then a class (Classes → Add class), then a participant.
- Open `/schedule` and `/coaches`: the new records should appear (within a minute at most; edits made in the admin refresh those pages immediately).
- Take attendance from Check-in and confirm the dashboard counts change.

## 7. Deploy

The app is a standard Next.js project and works on any host that runs Next.js 16 (for example Vercel).

On the host, set the three environment variables from step 5. **`NEXT_PUBLIC_SITE_URL` must be the real public address** (e.g. `https://savedbygracebjj.com`) — it is baked into every QR code the app generates. If it points at `localhost`, printed QR codes will not work.

Then build and deploy (`npm run build`; hosts like Vercel do this for you from the Git repository).

### Go-live checklist

- [ ] All four migrations applied (`npm run db:migrate -- --status` shows nothing pending); a first admin exists and can sign in
- [ ] `SUPABASE_SECRET_KEY` is set as a **server** environment variable on the host (and any previously shared secret key has been regenerated)
- [ ] Text messaging: either a provider is connected or coaches understand they'll send resets from their own phone
- [ ] Usage page (Admin → Usage) loads and shows the budget
- [ ] The Saturday classes are added under Admin → Classes, so the public schedule shows real times
- [ ] Public sign-ups disabled (step 3)
- [ ] `NEXT_PUBLIC_SITE_URL` is the production address
- [ ] The Messenger, YouTube, email and address in `lib/site.ts` are correct
- [ ] Schedule and coaches show real data on the public site
- [ ] The door QR (Admin → Check-in) opens `/checkin` on the production domain when scanned
- [ ] A coach account (not just an admin) has been tested: can check in, cannot open Classes or Coaches
- [ ] Photo consent: you have permission from members (and guardians of minors) to show them on the public gallery

## Operating notes

- **Schema changes:** never edit a migration that has already been applied. Add a new numbered file (`0004_….sql`) and run it. See [database.md](database.md#changing-the-schema).
- **Backups:** Supabase provides backups according to your plan. Check what your plan includes and, for anything you can't afford to lose (member records, attendance), consider periodic exports from the dashboard.
- **Inactivity:** some Supabase plans pause projects that get no traffic for a while. If the site suddenly shows empty schedule/coaches or admin errors, check the project is not paused.
- **Adding pages/routes:** run `npx next typegen` (or `npm run dev`) to regenerate the route types before type-checking.
