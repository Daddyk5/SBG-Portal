# Roadmap, open decisions and known limitations

## Companion mobile app — decision needed

The database, login and access rules are already shared, so an app can use the same Supabase project (URL + anon key) and the same staff accounts. Coaches would use it to take attendance from their phones. Two ways to build it:

| | **Installable PWA** (recommended first step) | **React Native (Expo)** |
|---|---|---|
| What it is | The existing web check-in screen, installable to the home screen | A separate native app |
| Effort | Small — reuses the current screen | Large — new codebase |
| Distribution | Just a link; no app-store review | App Store / Play Store |
| Best if | You mainly need coaches to take attendance quickly | You need offline check-in, push notifications, or store presence |

**Status: not started — waiting on this decision.**

**Members can already sign in** (username + password) to see their own progress — belt, attendance, and the coach feedback you chose to send — and customise their profile. The mobile app can use the same member and staff accounts.

## Known limitations

- **No automated tests.** Verified with type-check, lint and build only. Test access rules with both an admin and a coach account before relying on changes.
- **Gallery has no admin screen.** Photos are added by editing `lib/gallery.ts` and `public/gallery/`. A `gallery_items` table plus admin screen (using Supabase Storage) would let staff manage it. Videos are link-out only; embedding "latest videos" needs the YouTube channel ID.
- **Only the very first admin is created by hand** ([deployment.md](deployment.md#4-create-the-first-admin)); everyone else is added from Admin → Staff.
- **Progression entries can't be edited or deleted in the UI.** The database allows admins to; there is no screen for it yet.
- **No deleting participants.** By design — mark them inactive to keep history.
- **The personal QR link is the only credential for check-in.** Anyone holding it can check in as that member (it no longer shows progress). A future option is a staff-side scanner, or per-device confirmation.
- **Account creation, password-reset texts and member photo upload are not yet tested against a live Supabase project** (they need the secret key). The database logic behind them is covered by `npm run db:test`. Test with one member and one staff account first.
- **Password resets don't sign out existing sessions.** A reset sets a new password, but a device that was already signed in stays signed in until its session expires.
- **Texting needs an SMS account.** Until one is connected, coaches send resets from their own phone (the app prepares the message).
- **No self-service "forgot password".** By design, a coach or admin sends the reset (members have no email on file to send a link to).
- **A leaked member token can't be reset from the UI.** To issue a new one:

  ```sql
  update public.participants set checkin_token = gen_random_uuid() where id = '<participant id>';
  ```
  Then show the member their new QR from their profile.
- **Participant list is capped** at the first 200 matches (check-in at 1,000). Use search/filters; pagination would be needed for a much larger membership.
- **No email notifications, payments or membership dues tracking.**
- **Copy is draft.** The tagline, mission and program descriptions need a review by the ministry.
- **Public content refreshes within 5 minutes** for anything not edited through the admin (e.g. if you change data directly in the database).

## Ideas for later

- Member logins: personal attendance history and belt progress
- Gallery and announcements managed from the admin
- Attendance reports (per class, per member, streaks, "haven't attended in 30 days")
- Promotion-eligibility reminders (time in belt + attendance)
- Auto-check-in a walk-in right after adding them
- Bulk import of existing members from a spreadsheet
