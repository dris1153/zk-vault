// Tiny shared helpers for the standalone dev scripts (verify, db-reset).
// Reads .env.local from the project root (resolved relative to this file).

import { readFileSync } from "node:fs";

export function loadEnv(): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    fail("Missing .env.local - copy .env.local.example and fill it in.");
  }
  const env: Record<string, string> = {};
  for (const line of raw!.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

export function fail(msg: string): never {
  console.error(`\n  FAIL: ${msg}\n`);
  process.exit(1);
}

export function ok(msg: string): void {
  console.log(`  PASS  ${msg}`);
}
