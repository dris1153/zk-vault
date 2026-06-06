// Offline password health analysis over login items. zxcvbn-ts is LAZY-imported
// so its ~400KB stays out of the critical bundle. The report never contains a
// plaintext password - only the affected item entries.

import type { VaultItem } from "./items";
import type { VaultItemType } from "@/lib/supabase/types";

export interface HealthEntry {
  id: string;
  type: VaultItemType;
  title: string;
  username?: string;
}

export interface HealthReport {
  reused: HealthEntry[][]; // groups of items sharing one password
  weak: HealthEntry[];
  old: HealthEntry[];
  breached: HealthEntry[];
  totalIssues: number; // distinct affected items
  score: number; // 0-100, % of login items with no issue
}

interface Row {
  entry: HealthEntry;
  password: string;
  updatedAt: string;
}

function loginRows(items: VaultItem[]): Row[] {
  const rows: Row[] = [];
  for (const it of items) {
    if (it.type !== "login") continue;
    const password =
      typeof it.data.password === "string" ? it.data.password : "";
    if (!password) continue;
    rows.push({
      entry: {
        id: it.id,
        type: it.type,
        title: (it.data.title as string) ?? "Untitled",
        username:
          typeof it.data.username === "string" ? it.data.username : undefined,
      },
      password,
      updatedAt: it.updatedAt,
    });
  }
  return rows;
}

function findReused(rows: Row[]): HealthEntry[][] {
  const map = new Map<string, HealthEntry[]>();
  for (const r of rows) {
    const arr = map.get(r.password) ?? [];
    arr.push(r.entry);
    map.set(r.password, arr);
  }
  return [...map.values()].filter((g) => g.length >= 2);
}

function findOld(rows: Row[], maxAgeDays = 365): HealthEntry[] {
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  return rows
    .filter((r) => {
      const t = Date.parse(r.updatedAt);
      return Number.isFinite(t) && t < cutoff;
    })
    .map((r) => r.entry);
}

// ---- weak (lazy zxcvbn) ----
type Zxcvbn = (password: string) => { score: number };
let zxcvbnReady: Promise<Zxcvbn> | null = null;

function loadZxcvbn(): Promise<Zxcvbn> {
  if (!zxcvbnReady) {
    zxcvbnReady = (async () => {
      const core = await import("@zxcvbn-ts/core");
      const commonMod = await import("@zxcvbn-ts/language-common");
      const enMod = await import("@zxcvbn-ts/language-en");
      // Language packs are data blobs; cast at the boundary to avoid type friction.
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const common: any = (commonMod as { default?: unknown }).default ?? commonMod;
      const en: any = (enMod as { default?: unknown }).default ?? enMod;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      core.zxcvbnOptions.setOptions({
        dictionary: { ...common.dictionary, ...en.dictionary },
        graphs: common.adjacencyGraphs,
        translations: en.translations,
      });
      return core.zxcvbn as Zxcvbn;
    })();
  }
  return zxcvbnReady;
}

/** Strength score 0-4 for a single password (reuses the lazy zxcvbn loader). */
export async function scorePassword(password: string): Promise<number> {
  if (!password) return 0;
  const zxcvbn = await loadZxcvbn();
  return zxcvbn(password).score;
}

async function findWeak(rows: Row[]): Promise<HealthEntry[]> {
  const zxcvbn = await loadZxcvbn();
  const scoreCache = new Map<string, number>();
  const weak: HealthEntry[] = [];
  for (const r of rows) {
    let score = scoreCache.get(r.password);
    if (score === undefined) {
      score = zxcvbn(r.password).score;
      scoreCache.set(r.password, score);
    }
    if (score < 3) weak.push(r.entry);
  }
  return weak;
}

export async function analyzePasswordHealth(
  items: VaultItem[],
  opts: { breach?: boolean; weak?: boolean } = {},
): Promise<HealthReport> {
  const rows = loginRows(items);
  const reused = findReused(rows);
  const old = findOld(rows);
  // `weak` is gated so zxcvbn (~400KB) only downloads when the user actually
  // opens the security panel, not eagerly on every unlock.
  const weak = opts.weak === false ? [] : await findWeak(rows);
  const breached = opts.breach ? await findBreached(rows) : [];

  const affected = new Set<string>();
  for (const g of reused) for (const e of g) affected.add(e.id);
  for (const e of weak) affected.add(e.id);
  for (const e of old) affected.add(e.id);
  for (const e of breached) affected.add(e.id);

  const total = rows.length || 1;
  return {
    reused,
    weak,
    old,
    breached,
    totalIssues: affected.size,
    score: Math.round(100 * (1 - affected.size / total)),
  };
}

// ---- breach (HIBP k-anonymity, opt-in) ----
// Only the first 5 chars of the SHA-1 hash leave the device. The cache is keyed
// by the HASH (never plaintext) so locking leaves no plaintext password in the
// module heap, and only DEFINITIVE results are cached (transient failures retry).
const pwnedCache = new Map<string, number>();

async function sha1Hex(text: string): Promise<string> {
  const data = new Uint8Array(new TextEncoder().encode(text));
  const buf = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function pwnedCount(password: string): Promise<number> {
  try {
    const hash = await sha1Hex(password);
    const cached = pwnedCache.get(hash);
    if (cached !== undefined) return cached;
    const res = await fetch(
      `https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`,
    );
    if (!res.ok) return 0; // transient failure -> not cached, retried later
    const suffix = hash.slice(5);
    let count = 0;
    for (const line of (await res.text()).split("\n")) {
      const [suf, c] = line.trim().split(":");
      if (suf?.toUpperCase() === suffix) {
        count = Number(c) || 0;
        break;
      }
    }
    pwnedCache.set(hash, count); // cache only definitive results
    return count;
  } catch {
    return 0; // network failure -> not cached, treated as unknown
  }
}

async function findBreached(rows: Row[]): Promise<HealthEntry[]> {
  const unique = new Map<string, HealthEntry[]>();
  for (const r of rows) {
    const arr = unique.get(r.password) ?? [];
    arr.push(r.entry);
    unique.set(r.password, arr);
  }
  const breached: HealthEntry[] = [];
  for (const [password, entries] of unique) {
    if ((await pwnedCount(password)) > 0) breached.push(...entries);
  }
  return breached;
}
