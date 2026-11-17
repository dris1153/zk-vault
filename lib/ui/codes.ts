// Pure helpers for the Google-Authenticator-style Codes home screen:
// maps `authenticator` + TOTP-bearing `login` items into CodeEntry rows,
// sorts (pinned first, then A-Z by issuer), and filters by query.

import type { VaultItem } from "@/lib/vault/items";
import { parseTotpMeta } from "./totp";

export interface CodeEntry {
  id: string;
  item: VaultItem;
  issuer: string;
  account: string;
  secret: string;
  source: "authenticator" | "login";
  pinned: boolean;
  url: string;
  tags: string[];
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Extract every vault item that carries a TOTP secret into a CodeEntry list. */
export function toCodeEntries(items: VaultItem[]): CodeEntry[] {
  const out: CodeEntry[] = [];
  for (const item of items) {
    if (item.type !== "authenticator" && item.type !== "login") continue;
    const secret = str(item.data.totp_secret);
    if (!secret) continue;

    const meta = parseTotpMeta(secret);
    const rawTitle = str(item.data.title);
    const issuer = rawTitle || meta?.issuer || "Không tiêu đề";
    const account =
      item.type === "authenticator"
        ? str(item.data.account) || meta?.account || ""
        : str(item.data.username) || str(item.data.oauth_account) || meta?.account || "";
    const url = item.type === "login" ? str(item.data.url) : "";
    const tags = Array.isArray(item.data.tags)
      ? item.data.tags.filter((t): t is string => typeof t === "string")
      : [];

    out.push({
      id: item.id,
      item,
      issuer,
      account,
      secret,
      source: item.type,
      pinned: item.favorite,
      url,
      tags,
    });
  }
  return out;
}

/** Pinned items first, then alphabetical by issuer -> account. */
export function sortCodeEntries(entries: CodeEntry[]): CodeEntry[] {
  return [...entries].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const byIssuer = a.issuer.localeCompare(b.issuer, undefined, {
      sensitivity: "base",
    });
    if (byIssuer !== 0) return byIssuer;
    return a.account.localeCompare(b.account, undefined, {
      sensitivity: "base",
    });
  });
}

/** Sort and filter CodeEntry list by issuer, account, URL, or tags. */
export function filterCodeEntries(
  entries: CodeEntry[],
  query: string,
): CodeEntry[] {
  const sorted = sortCodeEntries(entries);
  const q = query.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter(
    (e) =>
      e.issuer.toLowerCase().includes(q) ||
      e.account.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
