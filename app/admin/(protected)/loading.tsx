import { Skeleton } from "@/components/ui/loading";

/** Shown while any admin screen is loading: a ghost of a typical page. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-3 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-16" />
          </div>
        ))}
      </div>
      <div className="card divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
