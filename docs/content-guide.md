# Content guide

How to change what visitors see on the public website — text, contact details, photos and logos. You need to edit files in the project and redeploy (or, when running locally, just save the file). What's edited **in the admin instead** is listed first.

## Edit in the admin (no code)

| Content | Where |
|---|---|
| Class schedule | Admin → **Classes** |
| Coach bios and photos | Admin → **Coaches** |

These update the public site immediately. Everything below is in the code.

## Contact details and site name

All in **`lib/site.ts`** — change it once and it updates the header, footer, contact page and Messenger button:

| Field | What it controls |
|---|---|
| `name`, `shortName`, `tagline` | Site name and the headline on the home page |
| `affiliation` | "Tom DeBlass BJJ Association" text |
| `email` | Contact and footer email link |
| `youtube` | YouTube links |
| `messenger` | The floating **Chat with us** button and the contact-page button |
| `address` | Venue and address lines (footer, contact page). The Google Map on the contact page is built from the venue name — adjust `MAP_SRC` in `app/(public)/contact/page.tsx` if the pin is wrong |
| `url` | Comes from `NEXT_PUBLIC_SITE_URL` — don't hard-code it |

## Page text

Text is written directly in each page file:

| Page | File | Notes |
|---|---|---|
| Home (mission, teasers, hero) | `app/(public)/page.tsx` | Mission statement and program teasers are near the top/middle |
| Programs | `app/(public)/programs/page.tsx` | The `PROGRAMS` list at the top: **BJJ** and the combined **Muay Thai & Kickboxing** session (name, description, bullet points) |
| Gallery intro | `app/(public)/gallery/page.tsx` | |
| Contact | `app/(public)/contact/page.tsx` | |

> The wording of the tagline, mission statement and program descriptions was drafted as a starting point. Please review and adjust it to say what the ministry actually wants to say.

## Gallery photos

Photos live in **`public/gallery/`** and are listed in **`lib/gallery.ts`**.

To **add** a photo:

1. Prepare the image (see below) and copy it into `public/gallery/`, e.g. `gallery-11.jpg`.
2. Add an entry to the `GALLERY` array in `lib/gallery.ts`:

   ```ts
   {
     src: "/gallery/gallery-11.jpg",
     alt: "Describe what is visible, e.g. Students practising a sweep on blue mats.",
     caption: "Saturday open mat",   // optional, shown under the photo
     width: 1440,                     // the image's real pixel size
     height: 1152,
   },
   ```
3. The **order** in the array is the order shown. To **remove** a photo, delete its entry (and the file).

**Writing `alt` text:** describe the photo for someone who can't see it — who or what is doing what. It's used by screen readers and shows if the image fails to load. Avoid naming children or individuals.

**Preparing images:**

- Width around **1400–1600 px**, JPEG, ideally **under ~400 KB**. Next.js resizes and optimises them for each visitor's screen, but smaller sources deploy and load faster.
- `width` and `height` in the entry must match the file, so the layout doesn't jump while loading.
- Clicking a gallery photo opens the full file in a new tab.
- The home page also uses a few of these photos (`HOME_PHOTOS` and the hero image in `app/(public)/page.tsx`).

**Videos:** the gallery links to the YouTube channel. Embedding the latest videos needs the channel's ID (starts with `UC…`) — see [roadmap.md](roadmap.md).

### Permission and privacy

The gallery is public and the photos include children. Only publish photos you have permission to use, and get guardian consent for minors. To take a photo down, remove its entry from `lib/gallery.ts` **and delete the file** from `public/gallery/` (otherwise it stays reachable by its direct address, and remains in the Git history — if that matters, ask a developer to purge it).

## Logos and icons

| File | Used for |
|---|---|
| `public/brand/logo-emblem.jpg` | Logo card on the home page hero |
| `public/brand/logo-banner.png` | Wide "Saved By Grace — Jiu-Jitsu" logo (source for the share image) |
| `app/icon.png` (512×512) | Browser tab icon |
| `app/apple-icon.png` (180×180) | Home-screen icon on iPhones |
| `app/opengraph-image.png` (1200×630) | Preview image when a link is shared on Facebook, Messenger, etc. |

The logo files have solid white backgrounds (no transparency), which is why the logo is shown on a white card rather than directly on the page background. If you get transparent versions (PNG/SVG), the logo can go straight into the site header.

To replace an icon, overwrite the file with an image of the same size and name.

## Colours and look

The site's look is controlled from the variables at the top of **`app/globals.css`**, and follows the logo: **white, black, red and blue**.

| Variable | What it is |
|---|---|
| `--brand`, `--brand-hover` | The logo red, used for buttons |
| `--accent-text` | The logo blue, used for links and small labels |
| `--grad-a`, `--grad-b` | The red → blue gradient on big headings |
| `--glow-blue`, `--glow-red` | The soft coloured glows in the background |
| `--background`, `--foreground`, `--muted`, `--surface`, `--border` | Page (white / black), text, secondary text, card glass and outlines |

Each has a light-mode value (in `:root`) and a dark-mode value (in the `prefers-color-scheme: dark` block, repeated under `[data-theme="dark"]` for members who pick Dark). Change them there and the whole site — public pages, admin and member pages — follows.

Members can also pick their own **theme** (match phone / light / dark) and **accent** (red / blue / black & white) in Settings; that only affects their own pages. The accent overrides just `--brand` / `--brand-hover` (see `[data-accent=…]` in the same file).

### Training day

The site says "We train every Saturday" using `trainingDay` in `lib/site.ts`. The actual class **times** come from Admin → Classes, not from code.

