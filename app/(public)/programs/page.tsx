import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/page-hero";
import { ProgramBadge } from "@/components/program-badge";
import { COMBINED_STRIKING } from "@/lib/constants";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Programs",
  description: "Brazilian Jiu-Jitsu, Muay Thai and kickboxing classes every Saturday in Davao City.",
};

const PROGRAMS = [
  {
    badge: "BJJ",
    name: "Brazilian Jiu-Jitsu",
    text: "The core of our ministry. Learn grappling, positional control and submissions in a supportive environment, progressing through the belt system at your own pace.",
    points: [
      "Fundamentals through advanced technique",
      "Live rolling and drilling",
      "Belt and stripe progression tracked by your coaches — and visible to you on My Progress",
    ],
  },
  {
    badge: COMBINED_STRIKING,
    name: "Muay Thai & Kickboxing",
    text: "Our striking session brings Muay Thai and kickboxing together in one class. Muay Thai — the art of eight limbs — adds elbows, knees and the clinch; kickboxing sharpens footwork, timing and combinations.",
    points: [
      "Pad work, bag work and partner drills",
      "Punches, kicks, knees and clinch technique",
      "Beginner friendly, with serious conditioning",
    ],
  },
];

export default function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow={`Every ${SITE.trainingDay}`}
        title="Programs"
        intro="Two sessions, one community. Come to one or stay for both."
      />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
        {PROGRAMS.map((p) => (
          <article key={p.name} className="card grid gap-8 p-7 md:grid-cols-2 md:p-10">
            <div>
              <ProgramBadge program={p.badge} />
              <h2 className="mt-4 text-3xl font-bold tracking-tight">{p.name}</h2>
              <p className="mt-3 text-muted">{p.text}</p>
            </div>
            <ul className="space-y-3 self-center">
              {p.points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span
                    className="mt-2 size-2 shrink-0 rounded-full bg-linear-to-br from-brand to-[#2456b5]"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <div className="pt-4 text-center">
          <Link href="/schedule" className="btn-primary">
            See when we train
          </Link>
        </div>
      </div>
    </>
  );
}
