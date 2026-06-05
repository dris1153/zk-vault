/**
 * Dev DB reset: DROP the vault tables (clears ALL vault data), remove throwaway
 * verify accounts, then re-apply every migration in supabase/migrations/.
 *
 *   npm run db:reset
 *
 * Needs a DIRECT Postgres connection (the anon key cannot run DDL). Set
 * SUPABASE_DB_URL in .env.local to the Supabase "Session pooler" URI
 * (Dashboard > Project Settings > Database > Connection string). It contains
 * your DB password - it is a SECRET and .env.local is gitignored.
 *
 * WARNING: this wipes all rows in vault_config + vault_items. Your real vault
 * data is destroyed. Use only during development.
 */
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { loadEnv, fail, ok } from "./script-env";

// CASCADE drops the dependent policies, indexes, and triggers too.
// Also removes leftover "+zkverify" throwaway users from the verify script
// (NOT your real account).
const RESET_SQL = `
drop table if exists public.vault_items cascade;
drop table if exists public.vault_config cascade;
drop function if exists public.set_updated_at cascade;
delete from auth.users where email like '%+zkverify%';
`;

function migrationFiles(): { name: string; sql: string }[] {
  const dir = new URL("../supabase/migrations/", import.meta.url);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(new URL(name, dir), "utf8"),
    }));
}

async function main() {
  const env = loadEnv();
  const dbUrl = env.SUPABASE_DB_URL;
  if (!dbUrl)
    fail(
      "Set SUPABASE_DB_URL in .env.local (Supabase > Settings > Database > Connection string, Session pooler).",
    );

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
  } catch (e) {
    fail(`Could not connect to Postgres: ${(e as Error).message}`);
  }

  console.log("\n  Resetting database...\n");
  try {
    await client.query(RESET_SQL);
    ok("dropped vault tables + cleaned throwaway accounts");

    for (const { name, sql } of migrationFiles()) {
      await client.query(sql);
      ok(`applied ${name}`);
    }
  } catch (e) {
    await client.end();
    fail(`Reset failed: ${(e as Error).message}`);
  }

  await client.end();
  console.log("\n  Database reset complete. Schema is up to date.\n");
}

main().catch((e) => fail(e?.message ?? String(e)));
