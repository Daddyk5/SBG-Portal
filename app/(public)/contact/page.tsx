import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Find ${SITE.name} at ${SITE.address.venue}, Bajada, Davao City.`,
};

const MAP_SRC = `https://www.google.com/maps?q=${encodeURIComponent(
  `${SITE.address.venue}, Bajada, Davao City, Philippines`,
)}&output=embed`;

export default function ContactPage() {
  return (
    <>
      <PageHero title="Contact" intro="Questions, first-class visits, visitors from other gyms — reach out any time." />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Location</h2>
            <address className="mt-3 space-y-1 not-italic">
              <p className="text-lg font-bold">{SITE.address.venue}</p>
              {SITE.address.lines.map((line) => (
                <p key={line} className="text-muted">
                  {line}
                </p>
              ))}
            </address>
          </section>

          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-accent">Get in touch</h2>
            <dl className="mt-3 space-y-4">
              <div>
                <dt className="text-sm text-muted">Facebook Messenger</dt>
                <dd>
                  <a href={SITE.messenger} target="_blank" rel="noopener noreferrer" className="btn-primary mt-1">
                    Chat with us
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Email</dt>
                <dd>
                  <a href={`mailto:${SITE.email}`} className="font-medium underline-offset-4 hover:underline">
                    {SITE.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">YouTube</dt>
                <dd>
                  <a
                    href={SITE.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    youtube.com/@SavedByGraceBJJ
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="card overflow-hidden">
          <iframe
            title={`Map showing ${SITE.address.venue} in Bajada, Davao City`}
            src={MAP_SRC}
            className="h-96 w-full border-0 lg:h-full lg:min-h-[28rem]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </>
  );
}
