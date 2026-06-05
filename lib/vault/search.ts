// In-memory fuzzy search over already-decrypted items. The server cannot search
// ciphertext, so search runs entirely client-side after unlock. Fast at personal
// scale (<1000 items); the Fuse index is cheap to rebuild per query.

import Fuse from "fuse.js";
import type { VaultItem } from "./items";

const KEYS = [
  "data.title",
  "data.username",
  "data.url",
  "data.service",
  "data.host",
  "data.network",
  "data.address",
  "data.notes",
  "data.tags",
];

export function searchItems(items: VaultItem[], query: string): VaultItem[] {
  const q = query.trim();
  if (!q) return items;
  const fuse = new Fuse(items, {
    keys: KEYS,
    threshold: 0.4,
    ignoreLocation: true,
  });
  return fuse.search(q).map((r) => r.item);
}
