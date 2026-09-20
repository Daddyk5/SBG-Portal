import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/public/page-hero";
import { GALLERY } from "@/lib/gallery";
import { BASE_PATH, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos and videos from training and events at Saved By Grace BJJ.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero title="Gallery" intro="Moments from training, seminars and community events." />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {GALLERY.length > 0 ? (
          // CSS columns give a masonry layout so photos of different shapes keep their proportions.
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {GALLERY.map((item, i) => (
              <li key={item.src} className="mb-4 break-inside-avoid">
                <figure className="card overflow-hidden">
                  <a
                    href={`${BASE_PATH}${item.src}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open full size: ${item.caption ?? item.alt}`}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="h-auto w-full"
                      priority={i < 2}
                    />
                  </a>
                  {item.caption && (
                    <figcaption className="p-3 text-sm text-muted">{item.caption}</figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-8 text-center text-muted">Photos are coming soon.</p>
        )}

        <div className="card mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Watch us on YouTube</h2>
            <p className="mt-1 text-muted">Training footage, seminars and testimonies.</p>
          </div>
          <a href={SITE.youtube} target="_blank" rel="noopener noreferrer" className="btn-primary">
            @SavedByGraceBJJ
          </a>
        </div>
      </div>
    </>
  );
}
