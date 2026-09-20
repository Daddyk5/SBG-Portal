import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/public/page-hero";
import { BeltBadge } from "@/components/belt-badge";
import { getCoaches } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Coaches",
  description: "Meet the coaches of 289 Saved By Grace JiuJitsu Ministry.",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function CoachesPage() {
  const coaches = await getCoaches();

  return (
    <>
      <PageHero title="Coaches" intro="The people who will guide you on the mats." />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {coaches.length === 0 ? (
          <p className="card p-8 text-center text-muted">Coach profiles are coming soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <article key={coach.id} className="card overflow-hidden">
                <div className="relative aspect-4/3 bg-foreground/5">
                  {coach.photo_url ? (
                    <Image
                      src={coach.photo_url}
                      alt={`Photo of ${coach.full_name}`}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-bold text-muted/50">
                      {initials(coach.full_name)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-bold">{coach.full_name}</h2>
                  {coach.belt_rank && (
                    <div className="mt-2">
                      <BeltBadge belt={coach.belt_rank} label={`${coach.belt_rank} belt`} />
                    </div>
                  )}
                  {coach.bio && <p className="mt-3 whitespace-pre-line text-muted">{coach.bio}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
