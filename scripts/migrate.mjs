// Applies the SQL files in supabase/migrations/ to your Supabase database, in order,
// remembering which ones already ran (table public.app_migrations). Safe to re-run.
//
//   npm run db:migrate              apply anything new
//   npm run db:migrate -- --status  show what is applied / pending
//   npm run db:migrate -- --baseline  mark every file as applied WITHOUT running it
//                                   (use once if you set the database up by pasting setup.sql)
//
// Needs SUPABASE_DB_URL in .env.local: Supabase -> Connect -> "Session pooler" string,
// with your database password filled in. It is a secret — never commit it.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

// Minimal .env.local loader (avoids another dependency).
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error(`
SUPABASE_DB_URL is not set.

  1. Supabase dashboard -> Connect -> "Session pooler" -> copy the connection string
  2. Replace [YOUR-PASSWORD] with your database password
  3. Add to .env.local:   SUPABASE_DB_URL=postgres://postgres.xxxx:PASSWORD@aws-0-....pooler.supabase.com:5432/postgres
  4. Run this command again

(No database password to hand? Open SQL Editor in the dashboard and paste supabase/setup.sql instead.)
`);
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

// Supabase's pooler uses its own certificate chain; the connection is still encrypted.
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(`
    create table if not exists public.app_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
    alter table public.app_migrations enable row level security; -- no policies: invisible to the public API
  `);
  const applied = new Set((await client.query("select name from public.app_migrations")).rows.map((r) => r.name));

  if (args.has("--status")) {
    for (const f of files) console.log(`${applied.has(f) ? "applied " : "PENDING "} ${f}`);
    process.exit(0);
  }

  if (args.has("--baseline")) {
    for (const f of files) {
      await client.query("insert into public.app_migrations (name) values ($1) on conflict do nothing", [f]);
    }
    console.log(`Marked ${files.length} migration(s) as applied without running them.`);
    process.exit(0);
  }

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log("Database is up to date.");
    process.exit(0);
  }

  for (const f of pending) {
    process.stdout.write(`Applying ${f} ... `);
    try {
      await client.query("begin");
      await client.query(readFileSync(join(dir, f), "utf8"));
      await client.query("insert into public.app_migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log("done");
    } catch (e) {
      await client.query("rollback").catch(() => {});
      console.log("FAILED");
      console.error(`\n${f}: ${e.message}${e.position ? ` (at character ${e.position})` : ""}`);
      console.error("Nothing from this file was applied. Fix the problem and run again.");
      process.exit(1);
    }
  }
  console.log(`\nApplied ${pending.length} migration(s).`);
} catch (e) {
  console.error(`Could not connect: ${e.message}`);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
