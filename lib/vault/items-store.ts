// In-RAM store of decrypted items. Populated on unlock, cleared on lock.
// Never persisted (decrypted plaintext must not touch storage).

import { create } from "zustand";
import { fetchItems, type VaultItem } from "./items";
import type { VaultItemType } from "@/lib/supabase/types";

interface ItemsState {
  items: VaultItem[];
  loading: boolean;
  setItems: (items: VaultItem[]) => void;
  setLoading: (loading: boolean) => void;
  upsert: (item: VaultItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useItems = create<ItemsState>((set) => ({
  items: [],
  loading: false,
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  upsert: (item) =>
    set((s) => {
      const rest = s.items.filter((i) => i.id !== item.id);
      return { items: [item, ...rest] };
    }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [], loading: false }),
}));

/** Decrypt and load all items into the store (called on unlock). */
export async function loadItems(dek: CryptoKey): Promise<void> {
  // Set loading synchronously (same tick as setUnlocked) so the grid shows
  // skeletons instead of a flash of the empty state.
  useItems.getState().setLoading(true);
  try {
    useItems.getState().setItems(await fetchItems(dek));
  } finally {
    useItems.getState().setLoading(false);
  }
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
