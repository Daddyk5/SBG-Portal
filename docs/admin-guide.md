# Admin guide

For coaches and admins of Saved By Grace BJJ. No technical knowledge needed.

The admin works on a phone, tablet or computer. Open **`/admin`** on the website (there is also a small **Staff** link at the very bottom of every public page).

## Signing in

1. Go to `/admin` and enter your email and password.
2. If you see *"This account doesn't have staff access"*, ask an admin to add you — signing in isn't enough on its own.
3. Use **Sign out** (top right) when you're done, especially on a shared device.

**Forgot your password?** Ask an admin: on **Staff** they press **Forgot password? Reset & text** and you'll be texted a temporary password (you must then choose your own). To change your password any time, use **Change password** (top right).

## What can I do? (Coach vs. Admin)

| | Coach | Admin |
|---|---|---|
| Take attendance (Check-in) | ✅ | ✅ |
| View participants and profiles | ✅ | ✅ |
| Add a new participant (e.g. walk-in) | ✅ | ✅ |
| Add progression notes and log promotions | ✅ | ✅ |
| Edit a participant's details, mark inactive | — | ✅ |
| Manage Classes (the public schedule) | — | ✅ |
| Manage Coaches (the public bios) | — | ✅ |
| Give a member a login, or reset a **member's** password by text | ✅ | ✅ |
| Add staff, reset a **staff** password, see Usage | — | ✅ |

Coaches don't see the **Classes** and **Coaches** tabs. If a coach opens those addresses directly they are sent back to the dashboard.

## Dashboard

Shows three numbers — **active participants**, **classes today** and **check-ins today** — and today's classes. Tap a class to go straight to its attendance list.

Below that, coaches can see what has been recorded lately:

- **Recent progress & feedback** — the latest promotions and notes, with who wrote about whom, and whether each note was *✉ Sent to member* or *🔒 Private*.
- **Recent check-ins** — the latest attendance, including which were **self check-ins (QR)** and which were recorded **by a coach**.

Tap a name to open that participant.

## Taking attendance (Check-in)

This is the screen to use at the start of class.

1. Open **Check-in**.
2. Under **Today**, tap the class. (Need another class or a past date? Use **A different class or date**.)
3. You'll see everyone who is active. **Tap a name to mark them present** — the row turns green with a ✓. **Tap again to undo.**
4. Use the **search box** to find a name quickly. The **All / Present / Absent** buttons filter the list. Tick **Only show … students** to hide people who aren't in this class's program.
5. The counter at the top shows how many are present. Changes save immediately — there is no Save button.

**Walk-ins:** tap **+ Add walk-in**, fill in the new person's details, save. You're returned to the check-in list; find them and tap their name to mark them present. (They are not marked present automatically.)

**Missed a session?** Choose the class, then set **Session date** to the day it happened and press **Go**. You can't pick a future date. If the date isn't the weekday the class normally runs, you'll see a warning — double-check you picked the right day.

**Members checking themselves in** (via QR) appear here as present too.

**Muay Thai & Kickboxing** are taught together in one class, so "Only show … students" for that class lists everyone enrolled in *either* program.

## Participants

**Participants** lists everyone. By default it shows **active** members; change **Status** to *All* or *Inactive* to see others. Search by name, or filter by **belt** or **program**, then press **Filter**.

Tap a person to open their **profile**:

- **Details** — contact info, join date, programs, notes.
- **Member QR** — the member's personal check-in code (see below).
- **Attendance** — a calendar of the last 26 weeks (darker squares = more sessions that day) and a list of recent sessions. Use **Log attendance** to record a session for this person on a chosen class and date (handy for corrections).
- **Progression** — a timeline of belt promotions, stripes and coach notes, newest first.

### Adding progress notes, feedback and promotions

On the profile, under **Progression → Add progress entry or feedback**:

- Write a **note** (e.g. "Great improvement on guard passing"). Decide who sees it:
  - **Tick "Send this note to the member"** → it is sent to the member as **coach feedback** on their My Progress page.
  - **Leave it unticked** → it stays **private to coaches** (use this for internal notes).
- Pick a **belt** and/or **stripe count** to record a promotion. This also updates the person's current belt and stripes automatically. A new belt with no stripe count starts at 0 stripes. **Promotions always show on the member's page.**
- You can **backdate** an entry with the date field (not into the future). Backdated entries won't overwrite a more recent promotion.

In the timeline each note is labelled **Sent to member** or **Private — coaches only**, so you can always tell what a member can see.

Progression entries can't be edited or deleted from the screen yet. If one was entered by mistake, add a corrective entry, or ask a developer to fix it in the database.

### Adding and editing participants (admins edit)

**Add participant** asks for name (required), email, phone, belt, stripes, date joined, programs, notes and an optional photo (JPEG, PNG or WebP, up to 5 MB). Admins can also press **Edit** on a profile to change any of this.

To stop someone appearing in check-in lists, an admin sets their **Status** to *Inactive*. There is deliberately no delete button: inactive keeps their history. Inactive members cannot use QR check-in.

Member photos are private — only signed-in staff can see them.

## Member logins and My Progress

Members can sign in at **`/member/login`** (also **My Progress** in the website menu) to see their own belt, attendance and the feedback you've sent, and to customise their profile.

### Giving a member a login

1. Open the participant's profile → **Member login** card.
2. Make sure they have a **phone number** (admins can add one under Edit) so the password can be texted.
3. Press **Create login & text password**. A username like `maria.santos` is suggested (you can type another).
4. They receive a **temporary password by text**. At first sign-in they choose their own.

If texting isn't connected you'll be given the message to send from your own phone (with a Copy button and an Open Messages button). See [accounts-and-sms.md](accounts-and-sms.md).

### Forgot password? (members)

On the member's profile press **Forgot password? Reset & text**. They get a new temporary password by text and must choose their own again. You can send one reset every 2 minutes. Any coach can do this for a member.

### What members see

- Their **belt and stripes**, member-since date, and how many classes they've attended (all time and last 30 days)
- A **calendar** of the last 26 weeks and their recent classes
- A **timeline** of promotions and **coach feedback** — only notes you ticked **Send this note to the member** for. Private notes and the participant **Notes** field are never shown to them.

### What members can change (Settings)

Profile photo, nickname, "about me / my goals", mobile number, email, theme (match phone / light / dark), accent colour (red / blue / black & white), and their password. They can't change their name, belt or anything you wrote.

## QR self check-in

Each member also has a **personal QR code** (on their profile, under **Member QR**) for checking in to class.

1. Show or send the member their personal QR. They scan it **once**; their phone remembers who they are.
2. On **Check-in** (scroll down) there is a **Gym door QR** to print and post at the entrance. After scanning their personal QR once, a member can scan the door QR to see today's classes and tap **Check in**.

Good to know:

- Check-in opens **60 minutes before class starts** and closes when class ends.
- A member can only be checked in once per class per day.
- The personal QR only lets someone **check in as that member** — it does **not** show progress (that needs the member's password). Still, treat it like a membership card and don't post it publicly. If one is shared by mistake, ask a developer to replace the member's token (see [database.md](database.md#functions)).
- A member who changes phones just scans their personal QR again.
- Inactive members can't use the QR link or sign in.

## Classes (admins)

**Classes** is the weekly schedule and it **feeds the public Schedule page** — changes show on the website straight away.

We train **every Saturday**, so add these classes (Day defaults to Saturday):

1. **Brazilian Jiu-Jitsu** — program **BJJ**
2. **Muay Thai & Kickboxing** — program **Muay Thai & Kickboxing** (one combined class)

- **Add class:** name, program, coach (optional), day, start and end time.
- **Edit / delete:** tap a class. A class that already has attendance recorded **can't be deleted** (to protect your attendance history) — edit it instead, for example to change its time or rename it.

## Coaches (admins)

**Coaches** manages the bios on the public Coaches page (separate from staff logins).

- Add a name, belt (optional), bio, **display order** (lower numbers appear first) and a **photo**. Coach photos are **public** on the website.
- To change a photo, upload a new one. To remove it, tick **Remove current photo**.
- Deleting a coach leaves their classes in place, with no coach assigned.

## Staff (admins)

**Staff** lists everyone who can sign in to the admin.

- **Add a coach or admin:** name, email (their sign-in), role and mobile number. They're texted a temporary password and must choose their own at first sign-in.
- **Save number:** the mobile number password-reset texts go to.
- **Forgot password? Reset & text:** sets a new temporary password and texts it. (Not for your own account — use **Change password**.)
- **Remove access:** deletes their login. You can't remove yourself or the last admin.

A banner at the top shows whether text messaging is connected. If not, resets show you the message to send yourself.

## Usage (admins)

**Usage** shows how much space the gym's data uses against the 5 GB budget (a bar that turns amber at 80% and red when full), split into database and photos, plus **Clean up unused photos**. Photos are shrunk automatically; new uploads are refused if the budget would be exceeded. See [data-limits.md](data-limits.md).

## Tips and troubleshooting

| Problem | Try |
|---|---|
| "Could not save…" message | Read the reason shown; check your internet, then retry. If it says permission denied, your account may not have the role for that action. |
| Someone is missing from Check-in | They may be **inactive**, or not yet added. Admins can change status; anyone can add a walk-in. |
| Photo won't upload | Use JPEG, PNG or WebP under 5 MB. |
| A class time change doesn't show on the public site | It should update immediately. Refresh the page; if still wrong, tell a developer. |
| Attendance shows on the wrong day | Use **Log attendance** on the profile to add the right session, and undo the wrong one from **Check-in** (choose that class and date, tap the name). |
| Member's QR says "Link not recognised" | The member is inactive or the code is out of date — check their status. |
| Member says they forgot their password | Their profile → **Forgot password? Reset & text**. |
| "Account tools aren't set up yet" | The server needs `SUPABASE_SECRET_KEY` — see [accounts-and-sms.md](accounts-and-sms.md). |
| "Storage is full" when uploading a photo | Admin → **Usage** → **Clean up unused photos**, or raise the budget/plan. |
