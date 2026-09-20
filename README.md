# 289 Saved By Grace BJJ — website, admin and app backend

The website for **289 Saved By Grace JiuJitsu Ministry** (Allegro Academy Studio, Bajada, Davao City), affiliated with the Tom DeBlass BJJ Association. It has three parts that share one Supabase backend:

| Part | Where | Who uses it |
|---|---|---|
| **Public website** — home, programs, schedule, coaches, gallery, contact, Messenger chat button | `/`, `/programs`, `/schedule`, `/coaches`, `/gallery`, `/contact` | Anyone |
| **Staff admin** — dashboard, participants, attendance check-in, progression log, classes, coaches | `/admin` | Coaches and admins (login required) |
| **Member area** — **My Progress** (belt journey, attendance, coach feedback) and profile **Settings**, behind a member login; plus QR self check-in | `/member`, `/member/login`, `/m/<token>`, `/checkin` | Members |

The gym trains **every Saturday**: Brazilian Jiu-Jitsu is one class, and Muay Thai & Kickboxing are taught together as another.

A companion mobile app is planned; it will use the same Supabase project. See [docs/roadmap.md](docs/roadmap.md).

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (Postgres, Auth, Storage) · Tailwind CSS v4 · TypeScript.

## Documentation

| Read this | If you want to… |
|---|---|
| [docs/admin-guide.md](docs/admin-guide.md) | **Use** the admin: sign in, take attendance, manage members, classes and coaches. Written for staff. |
| [docs/content-guide.md](docs/content-guide.md) | **Edit the site**: contact details, text, photos, logos. |
| [docs/deployment.md](docs/deployment.md) | **Set up and deploy**: Supabase project, environment variables, first admin, going live. |
| [docs/accounts-and-sms.md](docs/accounts-and-sms.md) | Understand **member/staff logins, password resets by text message**, and connect an SMS provider. |
| [docs/data-limits.md](docs/data-limits.md) | See how the project **stays under 5 GB** and how to read the Usage page. |
| [docs/database.md](docs/database.md) | Understand the **tables, access rules (RLS), views, functions and storage**. |
| [docs/architecture.md](docs/architecture.md) | Understand **how the code is organised**, how auth and caching work, and where to change things. |
| [docs/roadmap.md](docs/roadmap.md) | See **open decisions and known limitations**. |

## Quick start (local development)

Requires Node.js 20+ and a Supabase project (free tier is fine).

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run db:migrate             # applies the SQL (needs SUPABASE_DB_URL) — or paste supabase/setup.sql into the SQL Editor once
npm run dev                    # http://localhost:3000
```

Then create your first admin login — see [docs/deployment.md](docs/deployment.md#4-create-the-first-admin).

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase **publishable** key (`sb_publishable_…`). Older projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead — same role. Never use the secret/service_role key here. |
| `NEXT_PUBLIC_SITE_URL` | The site's public address, used for QR codes and links in texts. Must be the real domain in production. |
| `SUPABASE_SECRET_KEY` | **Server-only.** Lets the server create logins, reset passwords and store member photos. Never `NEXT_PUBLIC_`. See [accounts-and-sms.md](docs/accounts-and-sms.md). |
| `SUPABASE_DB_URL` | Only for `npm run db:migrate`: your Supabase "Session pooler" connection string. |
| `SMS_PROVIDER` + provider keys | Optional: send password-reset texts through Semaphore or Twilio. |
| `DATA_BUDGET_GB` | Optional: size budget (default 5). |

Without the two public Supabase variables the public pages still load (schedule and coaches show "coming soon" messages) and `/admin` shows a setup message instead of crashing.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Apply the SQL migrations to your Supabase database (`-- --status` to check, `-- --baseline` if you pasted `setup.sql`) |
| `npm run db:test` | Run every migration in an in-memory Postgres and check triggers, privacy and limits (no Supabase needed) |
| `npm run db:bundle` | Rebuild `supabase/setup.sql` from `supabase/migrations/` (run after editing a migration) |
| `npx tsc --noEmit` | Type-check only (run `npx next typegen` first after adding routes) |

## Project layout

```
app/(public)/     Public pages (share the header, footer and Messenger button)
app/admin/        Staff login, and (protected)/ for every signed-in screen
app/member/       Member login, My Progress and Settings (behind a member login)
app/m/[token]/    Member self check-in page (personal QR link)
app/checkin/      Landing page for the QR code posted at the gym door
components/       Shared UI (public/, admin/, member/, ui/ loaders, belt + program badges)
lib/              Site config, constants, auth helpers, Supabase clients, storage helpers
public/gallery/   Gallery photos        public/brand/   Logos
supabase/migrations/   The database, as ordered SQL files    supabase/setup.sql   Same thing in one paste
docs/             Documentation
proxy.ts          Refreshes login sessions and guards /admin
```

The full breakdown is in [docs/architecture.md](docs/architecture.md).

> **Note for contributors and AI assistants:** this project uses a newer Next.js than most documentation and training data covers (for example, `proxy.ts` replaces `middleware.ts`, and `params`/`searchParams` are promises). See `AGENTS.md`, and read the guides in `node_modules/next/dist/docs/` before changing framework-level code.
