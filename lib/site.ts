export const SITE = {
  name: "289 Saved By Grace JiuJitsu Ministry",
  shortName: "Saved By Grace BJJ",
  tagline: "Training the body. Strengthening the spirit.",
  /** Classes run on one day a week. Exact times live in the database (Admin -> Classes). */
  trainingDay: "Saturday",
  affiliation: "Tom DeBlass BJJ Association",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "savedbygracebjj@gmail.com",
  youtube: "https://www.youtube.com/@SavedByGraceBJJ",
  messenger: "https://www.facebook.com/messages/t/274954933357331",
  address: {
    venue: "Allegro Academy Studio",
    lines: [
      "Regina Dalisay Compound (at the back of Abreeza)",
      "Bajada, Davao City, Philippines, 8000",
    ],
    full: "Allegro Academy Studio, Regina Dalisay Compound, Bajada, Davao City, Philippines 8000",
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/schedule", label: "Schedule" },
  { href: "/coaches", label: "Coaches" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/member", label: "My Progress" },
] as const;
