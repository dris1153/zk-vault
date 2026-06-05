// In-RAM store of decrypted items. Populated on unlock, cleared on lock.
// Never persisted (decrypted plaintext must not touch storage).

import { create } from "zustand";
import { fetchItems, type VaultItem } from "./items";
import type { VaultItemType } from "@/lib/supabase/types";

interface ItemsState {
  items: VaultItem[];
  setItems: (items: VaultItem[]) => void;
  upsert: (item: VaultItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useItems = create<ItemsState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  upsert: (item) =>
    set((s) => {
      const rest = s.items.filter((i) => i.id !== item.id);
      return { items: [item, ...rest] };
    }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}));

/** Decrypt and load all items into the store (called on unlock). */
export async function loadItems(dek: CryptoKey): Promise<void> {
  useItems.getState().setItems(await fetchItems(dek));
}

export function clearItems(): void {
  useItems.getState().clear();
}

/** Per-category counts from plaintext metadata (no decrypt needed). */
export function countByType(items: VaultItem[]): Record<VaultItemType, number> {
  const base: Record<VaultItemType, number> = {
    login: 0,
    wallet: 0,
    ssh_key: 0,
    secure_note: 0,
    api_key: 0,
    database: 0,
  };
  for (const i of items) base[i.type] += 1;
  return base;
}
