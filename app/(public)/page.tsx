import Image from "next/image";
import Link from "next/link";
import { ProgramBadge } from "@/components/program-badge";
import { COMBINED_STRIKING } from "@/lib/constants";
import { SITE } from "@/lib/site";

const HOME_PHOTOS = [
  { src: "/gallery/gallery-09.jpg", alt: "A coach presents a certificate to a smiling student." },
  { src: "/gallery/gallery-04.jpg", alt: "Kids and adults training together on blue mats." },
  { src: "/gallery/gallery-01.jpg", alt: "The team gathered on the mats after training." },
];

const SESSIONS = [
  {
    program: "BJJ",
    name: "Brazilian Jiu-Jitsu",
    text: "Technique, leverage and perseverance on the mats — from your first class to your next belt.",
  },
  {
    program: COMBINED_STRIKING,
    name: "Muay Thai & Kickboxing",
    text: "One combined striking session: punches, kicks, knees and conditioning, for every level.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-8 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="eyebrow animate-fade-up">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            Davao City · Jiu-Jitsu Ministry
          </p>
          <h1 className="text-gradient animate-fade-up mt-5 pb-2 text-5xl font-black leading-[1.05] tracking-tight [animation-delay:60ms] sm:text-6xl">
            {SITE.tagline}
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg text-muted [animation-delay:120ms]">
            289 Saved By Grace is a Brazilian Jiu-Jitsu ministry. We train together, grow together and
            serve our community — all on the foundation of grace.
          </p>
          <p className="animate-fade-up mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold backdrop-blur-md [animation-delay:160ms]">
            <span aria-hidden="true">📅</span> We train every {SITE.trainingDay}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:200ms]">
            <Link href="/schedule" className="btn-primary">
              View class schedule
            </Link>
            <Link href="/contact" className="btn-secondary">
              Visit us
            </Link>
          </div>
        </div>

        <div className="animate-fade-up relative [animation-delay:150ms]">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-linear-to-br from-brand/25 via-transparent to-accent/25 blur-2xl" />
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-border shadow-2xl">
            <Image
              src="/gallery/gallery-02.jpg"
              alt="Two young girls practising a seated guard position on the mats."
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="animate-float absolute -bottom-6 -left-3 w-36 rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10 sm:-left-8 sm:w-44">
            <Image
              src="/brand/logo-emblem.jpg"
              alt="Saved By Grace Jiu-Jitsu logo: a red cross inside a black circle, with Ephesians 2:8-9"
              width={1380}
              height={1061}
              sizes="176px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Mission + affiliation */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-8">
            <h2 className="text-3xl font-bold tracking-tight">Our mission</h2>
            <p className="mt-4 text-lg text-muted">
              We use Jiu-Jitsu as a way to build character, discipline and community, and to point
              people toward Christ. Whether you are stepping on the mats for the first time or
              chasing your next belt, there is a place for you here.
            </p>
          </div>
          <div className="card flex flex-col justify-center p-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">Affiliation</h2>
            <p className="mt-3 text-2xl font-bold">{SITE.affiliation}</p>
            <p className="mt-2 text-muted">
              Connecting our students to a worldwide family of Jiu-Jitsu practitioners.
            </p>
          </div>
        </div>
      </section>

      {/* What we teach */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Every {SITE.trainingDay}</h2>
            <p className="mt-1 text-muted">Two sessions, one community.</p>
          </div>
          <Link href="/schedule" className="text-sm font-semibold text-accent hover:underline">
            See the schedule →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SESSIONS.map((s) => (
            <article
              key={s.program}
              className="card group p-7 transition duration-300 hover:-translate-y-1 hover:border-accent/40"
            >
              <ProgramBadge program={s.program} />
              <h3 className="mt-4 text-2xl font-bold">{s.name}</h3>
              <p className="mt-2 text-muted">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Photos */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Life on the mats</h2>
          <Link href="/gallery" className="text-sm font-semibold text-accent hover:underline">
            Full gallery →
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {HOME_PHOTOS.map((photo) => (
            <li
              key={photo.src}
              className="card group relative aspect-4/3 overflow-hidden transition duration-300 hover:-translate-y-1"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1152px) 368px, (min-width: 640px) 33vw, 100vw"
                className="object-cover object-top transition duration-500 group-hover:scale-105"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card relative overflow-hidden p-8 sm:p-10">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ready to try a class?</h2>
              <p className="mt-1 text-muted">
                Message us on Messenger or drop by {SITE.address.venue} in Bajada.
              </p>
            </div>
            <a href={SITE.messenger} target="_blank" rel="noopener noreferrer" className="btn-primary">
              Chat with us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
