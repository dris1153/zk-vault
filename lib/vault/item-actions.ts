// CRUD wrappers that keep the in-RAM items store in sync after each mutation.

import {
  createItem,
  updateItem,
  deleteItem,
  setFavorite,
  type VaultItem,
} from "./items";
import { useItems } from "./items-store";
import type { VaultItemType } from "@/lib/supabase/types";

export async function addItem(
  dek: CryptoKey,
  type: VaultItemType,
  data: unknown,
  favorite = false,
): Promise<VaultItem> {
  const item = await createItem(dek, type, data, favorite);
  useItems.getState().upsert(item);
  return item;
}

export async function editItem(
  dek: CryptoKey,
  id: string,
  type: VaultItemType,
  data: unknown,
  favorite: boolean,
): Promise<VaultItem> {
  const item = await updateItem(dek, id, type, data, favorite);
  useItems.getState().upsert(item);
  return item;
}

export async function removeItem(id: string): Promise<void> {
  await deleteItem(id);
  useItems.getState().remove(id);
}

export async function toggleFavorite(item: VaultItem): Promise<void> {
  const favorite = !item.favorite;
  await setFavorite(item.id, favorite);
  useItems.getState().upsert({ ...item, favorite });
}
