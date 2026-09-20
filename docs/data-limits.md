# Data size and staying under 5 GB

The project is set up to stay under a **5 GB** total (database + stored files), and to warn and then stop taking new photos before it gets there.

> **Check your Supabase plan too.** 5 GB is the app's own budget. Supabase plans have their own included amounts (the Free plan includes far less than 5 GB of database and storage; paid plans include more). The Usage page and the limits below help you stay small either way, but the plan's allowance is what Supabase enforces — check it at supabase.com/pricing and your dashboard.

## What actually uses space

| Data | Typical size | Notes |
|---|---|---|
| Attendance, progress notes, members | tens of MB **for years** | ~100 bytes per check-in. 200 members × 2 classes a week × 52 weeks ≈ 20,000 rows/year ≈ a few MB |
| Photos | the only thing that can grow | Shrunk to ≤1024 px WebP (~60–200 KB each) instead of several MB |
| Text-message log | tiny | Auto-trimmed after 90 days |

So realistically the database stays far below 5 GB; photos are what the safeguards are for.

## Safeguards (all automatic)

1. **Photos are compressed on upload** (`lib/storage.ts`): rotated correctly, fitted inside 1024×1024, saved as WebP at quality 78. A 4 MB phone photo becomes roughly 100 KB.
2. **Hard size limits:** browsers may upload up to 5 MB per photo (then it's shrunk); storage buckets also refuse any stored file over **2 MB**.
3. **One photo per person.** Replacing a photo deletes the old one, so storage doesn't accumulate.
4. **A budget check before every upload** (`checkRoomFor`, using the `usage_bytes()` database function): if database + files plus the new photo would exceed the budget, the upload is refused with a clear message.
5. **Text length limits** in the database: coach/progress notes ≤ 2,000 characters, member "about me" ≤ 500, nickname ≤ 40 — nobody can bloat the database with huge text.
6. **Self-trimming logs:** the SMS log deletes rows older than 90 days whenever a new one is written.
7. **Counters instead of counting:** each member's attendance total is kept up to date by a database trigger, so pages don't have to scan history.

## The Usage page (admins)

Admin → **Usage** shows:

- Total used vs. the budget, with a bar that turns **amber at 80%** and **red at 100%**
- Database vs. photos/files
- Photos per bucket, and the largest tables
- **Clean up unused photos** — deletes photo files that nothing points at any more (for example, left over from a failed upload). Files younger than an hour are never touched.

## Changing the budget

Set `DATA_BUDGET_GB` (server env var), e.g. `DATA_BUDGET_GB=2`. The default is 5.

## If you get close

1. Open **Usage** and press **Clean up unused photos**.
2. Look at *Photos*: many large files? Ask people to replace old photos (the old one is deleted).
3. Consider upgrading the Supabase plan, or raise `DATA_BUDGET_GB` only if your plan really includes that much.
