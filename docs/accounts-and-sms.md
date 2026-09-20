# Accounts, password resets and text messages

How logins work for **members** and **staff**, how an admin resets a forgotten password by text message, and how to connect an SMS provider.

## Two kinds of login

| | Who | Signs in at | With | Sees |
|---|---|---|---|---|
| **Staff** | Coaches and admins | `/admin/login` | Email + password | The admin (what their role allows) |
| **Member** | Students | `/member/login` | **Username** + password | Only **their own** progress, attendance and shared coach feedback, and their own settings |

Both are ordinary Supabase Auth accounts. Members type a username, but Supabase needs an email, so each member account gets an internal address like `maria.santos@members.sbg.local` (members never see or use it). If you'd rather use a domain you own, set `MEMBER_EMAIL_DOMAIN` (server env var) **before** creating any member logins.

> ⚠️ **Not yet tested against a live Supabase project.** The database logic is covered by automated tests (`npm run db:test`), but creating logins and sending texts needs your project's secret key and (optionally) an SMS account. If Supabase rejects the internal `.local` address when you create the first member login, set `MEMBER_EMAIL_DOMAIN` to any normal-looking domain and try again.

## One-time setup

1. **Apply the database** (includes the member/account tables): see [deployment.md](deployment.md#2-set-up-the-database).
2. **Add the secret key** to the server environment (see below). Without it, everything else works but you can't create logins, reset passwords by text, or let members upload photos, and the Staff page shows a notice.
3. Optionally **connect an SMS provider** (see below). Without one, coaches are given the message to send from their own phone.

### The secret key

Creating a login for someone else and resetting their password are things a normal signed-in user is not allowed to do, so those actions use Supabase's **secret key** on the server.

- Get it: Supabase → Project Settings → API Keys → **Secret key** (`sb_secret_…`).
- Put it in `.env.local` as **`SUPABASE_SECRET_KEY`** and set it as a **server** environment variable on your host. **Never** prefix it with `NEXT_PUBLIC_` (that would send it to every visitor's browser) and never commit it or paste it into chat.
- It is only used inside Server Actions, after the code has verified who is asking (`lib/supabase/admin.ts`). The file is marked `server-only`, so the build fails if it is ever imported into browser code.
- If a secret key was ever shared or posted somewhere, **regenerate it** in the dashboard and update your environment.

## Creating logins

- **Members:** open the participant's profile → **Member login** card → **Create login & text password**. A username is suggested (`first.last`); you can type another. The member gets a **temporary password by text** and must choose their own the first time they sign in. Any coach or admin can do this.
- **Staff:** Admin → **Staff** → **Add a coach or admin** (admins only). Same idea, with the email as the sign-in.

## "Forgot password" — reset by text

1. Open the person's profile (member) or the **Staff** page (staff).
2. Press **Forgot password? Reset & text**.
3. The system sets a new random temporary password and sends it as a text message to the phone number on file. The person is forced to choose their own password on their next sign-in.

Rules:

- **Members:** any coach or admin can reset. **Staff:** admins only, and not your own (use **Change password** for that).
- One reset per person every **2 minutes** (stops accidental repeats and abuse).
- The phone number comes from the member's profile (they can update it under Settings, admins can under Edit) or the staff member's number on the Staff page. Numbers typed like `0917 123 4567` are converted automatically to international format (`+63…`).
- The temporary password is **never stored** anywhere — not in the database, not in logs. Only *who / when / whether it was sent* (and the last 4 digits of the number) is kept, for 90 days.
- Existing signed-in sessions are not signed out by a reset. If a device was lost or stolen, also remove the person's access or ask them to sign out everywhere.

### If texting isn't connected (or fails)

You'll see the message on screen with **Copy message** and **Open Messages app** buttons (the second opens your phone's Messages app pre-filled). Send it yourself. The password is shown once, to you, only in this case.

## Connecting an SMS provider

Set these **server** environment variables (`.env.local` and your host) and restart:

**Semaphore** (Philippines, pay-as-you-go):

```
SMS_PROVIDER=semaphore
SEMAPHORE_API_KEY=your-key
SEMAPHORE_SENDER_NAME=SavedByGrace      # optional, must be an approved sender name
```

**Twilio** (international):

```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1XXXXXXXXXX
```

Optional: `SMS_DEFAULT_COUNTRY_CODE=63` is used for numbers typed without a country code.

The Staff page shows which provider is active. Each text costs a small amount with your provider — password resets are the only texts the system sends. To add another provider, edit `lib/sms.ts` (a single `sendSms` function).

## Member settings (customising the profile)

After signing in, a member can open **Settings** to change:

- **Profile photo** (resized automatically)
- **Nickname** (how their page greets them) and **About me / my goals**
- **Mobile number and email** (so coaches can reach them)
- **Theme:** match phone / light / dark
- **Accent colour:** red, blue or black & white (buttons and highlights)
- **Password**

They **cannot** change their name, belt, or coach notes. Their theme and accent apply only to their own pages.

## Security summary

- Members reach their data **only through three database functions** (`my_profile`, `my_progress`, `update_my_profile`) that return their own row and nothing else. They have no access to any table, so coach-only notes (`participants.notes`, private progression notes) can never be read by them — this is enforced and tested in `npm run db:test`.
- Sign-in error messages are identical for a wrong username and a wrong password, so usernames can't be discovered.
- Staff and member accounts are separate: a member cannot open `/admin`, and staff cannot use `/member` unless they are also a member.
- Turn off public sign-ups in Supabase (Authentication → Sign In / Providers) — all accounts are created by staff.
