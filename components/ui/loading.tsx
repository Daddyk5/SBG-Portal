/** Loading building blocks. Used by the route-level loading.tsx files. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/**
 * Branded full-area loader: a spinning ring around the "289" mark, and a black belt
 * with a red tab sliding along it.
 */
export function BrandLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-7 px-4 text-center"
    >
      <div className="relative size-24">
        <span className="absolute inset-0 rounded-full border-2 border-border" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand border-r-accent [animation-duration:1.1s]" />
        <span className="absolute inset-3 rounded-full bg-surface backdrop-blur-md" />
        <span className="text-gradient absolute inset-0 grid place-items-center text-2xl font-black tracking-tight">
          289
        </span>
      </div>

      <div className="relative h-2.5 w-44 overflow-hidden rounded-full bg-[#0a0a0b] ring-1 ring-border dark:bg-[#26262b]">
        <span className="animate-belt absolute inset-y-0 left-0 w-1/4 rounded-full bg-brand" />
      </div>

      <p className="text-sm font-medium text-muted">{label}…</p>
    </div>
  );
}
