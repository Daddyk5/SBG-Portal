import { requireAdmin } from "@/lib/auth";
import { DATA_BUDGET_BYTES, WARN_RATIO, formatBytes } from "@/lib/limits";
import { createClient } from "@/lib/supabase/server";
import { cleanOrphanedPhotos } from "./actions";
import { CleanupButton } from "./cleanup-button";

export const metadata = { title: "Usage" };

type Summary = {
  db_bytes: number;
  storage_bytes: number;
  buckets: { bucket: string; files: number; bytes: number }[];
  tables: { name: string; bytes: number; rows: number }[];
};

export default async function UsagePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("usage_summary");
  const summary = (data as unknown as Summary | null) ?? null;

  const used = summary ? Number(summary.db_bytes) + Number(summary.storage_bytes) : 0;
  const ratio = Math.min(used / DATA_BUDGET_BYTES, 1);
  const state = ratio >= 1 ? "full" : ratio >= WARN_RATIO ? "warn" : "ok";
  const barColor = state === "ok" ? "bg-accent" : state === "warn" ? "bg-amber-500" : "bg-danger";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
        <p className="mt-1 text-muted">
          How much space the gym&apos;s data uses, against the {formatBytes(DATA_BUDGET_BYTES)} budget. Photos are
          shrunk automatically and uploads stop before the budget is exceeded.
        </p>
      </div>

      {error || !summary ? (
        <p role="alert" className="card border-danger/40 p-4 text-sm text-danger">
          Couldn&apos;t read usage{error ? `: ${error.message}` : ""}. Make sure migration 0004 has been applied.
        </p>
      ) : (
        <>
          <section className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-4xl font-black tabular-nums">{formatBytes(used)}</p>
              <p className="text-sm text-muted">
                of {formatBytes(DATA_BUDGET_BYTES)} · {(ratio * 100).toFixed(ratio < 0.1 ? 2 : 1)}% used
              </p>
            </div>
            <div
              className="mt-4 h-3 overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(ratio * 100)}
              aria-label="Storage used"
            >
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(ratio * 100, 0.5)}%` }} />
            </div>
            {state !== "ok" && (
              <p role="status" className="mt-3 text-sm font-semibold text-danger">
                {state === "full"
                  ? "The budget is full: new photo uploads are blocked. Clean up unused photos below or upgrade the plan."
                  : "Getting close to the budget. Clean up unused photos below."}
              </p>
            )}
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">Database (records)</dt>
                <dd className="text-xl font-bold tabular-nums">{formatBytes(Number(summary.db_bytes))}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Photos &amp; files</dt>
                <dd className="text-xl font-bold tabular-nums">{formatBytes(Number(summary.storage_bytes))}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              The database figure includes a fixed baseline for Supabase&apos;s own system tables, so it never reads
              zero. Your Supabase plan has its own limits as well (see supabase.com/pricing).
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="text-lg font-bold">Photos</h2>
              {summary.buckets.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No photos uploaded yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border text-sm">
                  {summary.buckets.map((b) => (
                    <li key={b.bucket} className="flex items-center justify-between py-2">
                      <span>
                        {b.bucket === "coach-photos" ? "Coach photos" : "Member photos"}{" "}
                        <span className="text-muted">({b.files})</span>
                      </span>
                      <span className="tabular-nums">{formatBytes(Number(b.bytes))}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5">
                <CleanupButton action={cleanOrphanedPhotos} />
                <p className="mt-2 text-xs text-muted">
                  Deletes photo files that no member or coach uses any more (for example after a photo was replaced).
                </p>
              </div>
            </section>

            <section className="card p-6">
              <h2 className="text-lg font-bold">Largest tables</h2>
              <ul className="mt-3 divide-y divide-border text-sm">
                {summary.tables.slice(0, 8).map((t) => (
                  <li key={t.name} className="flex items-center justify-between py-2">
                    <span>
                      {t.name} <span className="text-muted">(~{Number(t.rows).toLocaleString()} rows)</span>
                    </span>
                    <span className="tabular-nums">{formatBytes(Number(t.bytes))}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
