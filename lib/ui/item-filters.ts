// Per-type filter facets + sort for the Vault filter controls. Pure logic.
// Facet VALUES are derived from the items present (like tags), so the dropdown
// only ever offers values that actually exist.

import type { VaultItem } from "@/lib/vault/items";
import type { VaultItemType } from "@/lib/supabase/types";
import { findPlatform, domainOf } from "./platforms";
import { engineLabel } from "./db-engines";

export type Category = "all" | "favorites" | VaultItemType;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const identity = (v: string) => v;

export interface Facet {
  label: string;
  value: (item: VaultItem) => string | null; // null = excluded from the facet
  optionLabel: (v: string) => string;
}

export const FACET_BY_TYPE: Partial<Record<VaultItemType, Facet>> = {
  login: {
    label: "Nền tảng",
    value: (i) => {
      const url = str(i.data.url);
      if (!url) return null;
      return findPlatform(url)?.name || domainOf(url) || null;
    },
    optionLabel: identity,
  },
  wallet: {
    label: "Network",
    value: (i) => str(i.data.network) || null,
    optionLabel: identity,
  },
  ssh_key: {
    label: "Host",
    value: (i) => str(i.data.host) || null,
    optionLabel: identity,
  },
  api_key: {
    label: "Dịch vụ",
    value: (i) => str(i.data.service) || null,
    optionLabel: identity,
  },
  database: {
    label: "Engine",
    value: (i) => str(i.data.engine) || null,
    optionLabel: engineLabel,
  },
};

/** Distinct, sorted facet values present in `items`. */
export function facetOptions(facet: Facet, items: VaultItem[]): string[] {
  const set = new Set<string>();
  for (const i of items) {
    const v = facet.value(i);
    if (v) set.add(v);
  }
  return [...set].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export type SortKey = "updated" | "created" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Mới sửa" },
  { value: "created", label: "Mới thêm" },
  { value: "name", label: "Tên A-Z" },
];

export function sortItems(items: VaultItem[], key: SortKey): VaultItem[] {
  const copy = [...items];
  if (key === "name") {
    copy.sort((a, b) =>
      str(a.data.title).localeCompare(str(b.data.title), undefined, {
        sensitivity: "base",
      }),
    );
  } else if (key === "created") {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return copy;
}

// Single source of truth for which categories show (and therefore apply) each
// filter-bar toggle - so the render gate and the apply logic can never drift.
export const showsFavFilter = (c: Category) => c !== "favorites";
export const shows2FAFilter = (c: Category) => c === "all" || c === "login";

/** Login or authenticator item that carries a TOTP secret. */
export function hasTotp(item: VaultItem): boolean {
  return (
    (item.type === "login" || item.type === "authenticator") &&
    str(item.data.totp_secret).trim().length > 0
  );
}
