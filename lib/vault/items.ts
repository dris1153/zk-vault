// Vault item CRUD. Encrypt before insert/update, decrypt after fetch - the
// server only ever sees ciphertext. All calls run in the browser under RLS.

import { supabase } from "@/lib/supabase/client";
import { encryptJSON, decryptJSON } from "@/lib/crypto";
import type { VaultItemRow, VaultItemType } from "@/lib/supabase/types";
import { parseItemData, type ItemData } from "./schemas";

const TABLE = "vault_items";

export interface VaultItem {
  id: string;
  type: VaultItemType;
  favorite: boolean;
  data: ItemData; // decrypted, validated payload
  createdAt: string;
  updatedAt: string;
}

async function rowToItem(row: VaultItemRow, dek: CryptoKey): Promise<VaultItem> {
  const data = await decryptJSON<ItemData>(
    { iv: row.iv, ct: row.encrypted_data },
    dek,
  );
  return {
    id: row.id,
    type: row.type,
    favorite: row.favorite,
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetch + decrypt all items for the signed-in user (newest first). */
export async function fetchItems(dek: CryptoKey): Promise<VaultItem[]> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as VaultItemRow[];
  return Promise.all(rows.map((r) => rowToItem(r, dek)));
}

export async function createItem(
  dek: CryptoKey,
  type: VaultItemType,
  data: unknown,
  favorite = false,
): Promise<VaultItem> {
  const clean = parseItemData(type, data);
  const blob = await encryptJSON(clean, dek);
  // user_id is filled by the column default auth.uid() + enforced by RLS.
  const { data: row, error } = await supabase()
    .from(TABLE)
    .insert({ type, favorite, encrypted_data: blob.ct, iv: blob.iv })
    .select("*")
    .single();
  if (error) throw error;
  return rowToItem(row as VaultItemRow, dek);
}

export async function updateItem(
  dek: CryptoKey,
  id: string,
  type: VaultItemType,
  data: unknown,
  favorite: boolean,
): Promise<VaultItem> {
  const clean = parseItemData(type, data);
  const blob = await encryptJSON(clean, dek);
  const { data: row, error } = await supabase()
    .from(TABLE)
    .update({ favorite, encrypted_data: blob.ct, iv: blob.iv })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return rowToItem(row as VaultItemRow, dek);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const { error } = await supabase()
    .from(TABLE)
    .update({ favorite })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
