// Encrypted export / import - the Option-A recovery vehicle.
//
// Export bundles the (already ciphertext) config + items into a .vault file. It
// is safe to store anywhere: nothing inside is readable without the master
// password or the recovery key. No DEK / plaintext / auth secret is serialized.
//
// Import decrypts the bundle locally (master OR recovery key), then RE-encrypts
// each item under the CURRENTLY open vault's DEK and writes it. This is how you
// recover after a lost master: create a new vault, then import your old .vault
// with the 24-word recovery key.
//
// Import is atomic on decrypt (all items are decrypted in memory before any
// write, so a wrong key / corrupt item fails before touching the DB) and
// idempotent on write (rows upsert by their original id, so re-running a
// partially-completed import never duplicates).

import { supabase } from "@/lib/supabase/client";
import {
  unlockWithMaster,
  unlockWithRecovery,
  encryptJSON,
  decryptJSON,
  type VaultConfigCrypto,
} from "@/lib/crypto";
import { getVaultConfig } from "@/lib/supabase/vault-config";
import type { VaultItemRow, VaultItemType } from "@/lib/supabase/types";
import { loadItems } from "./items-store";
import { useSettings } from "./settings-store";

const FORMAT = "zk-vault";

interface ExportItem {
  id: string;
  type: VaultItemType;
  favorite: boolean;
  iv: string;
  ct: string;
}

interface VaultExport {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  config: VaultConfigCrypto;
  items: ExportItem[];
}

/** Build the encrypted bundle and trigger a browser download. */
export async function exportVault(): Promise<void> {
  const config = await getVaultConfig();
  if (!config) throw new Error("No vault to export");

  const { data, error } = await supabase()
    .from("vault_items")
    .select("id,type,favorite,encrypted_data,iv")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const items: ExportItem[] = ((data ?? []) as VaultItemRow[]).map((r) => ({
    id: r.id,
    type: r.type,
    favorite: r.favorite,
    iv: r.iv,
    ct: r.encrypted_data,
  }));

  const bundle: VaultExport = {
    format: FORMAT,
    version: config.version,
    exportedAt: new Date().toISOString(),
    config,
    items,
  };

  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.vault`;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }

  // Record the backup time so the UI can nudge when it goes stale.
  useSettings.getState().update({ lastExportAt: new Date().toISOString() });
}

function parseBundle(text: string): VaultExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Not a valid .vault file");
  }
  const b = parsed as VaultExport;
  if (b?.format !== FORMAT || !b.config || !Array.isArray(b.items))
    throw new Error("Unrecognized .vault file format");
  return b;
}

export interface ImportSecret {
  master?: string;
  recoveryWords?: string[];
}

export interface ImportResult {
  imported: number;
  total: number;
}

/**
 * Restore items from a .vault file into the currently-open vault. Decrypts with
 * the file's own master/recovery key, then re-encrypts under the live DEK.
 */
export async function importVault(
  file: File,
  secret: ImportSecret,
  currentDek: CryptoKey,
): Promise<ImportResult> {
  const bundle = parseBundle(await file.text());

  // Unlock the file's DEK. A wrong key fails here, cleanly, before any write.
  let fileDek: CryptoKey;
  try {
    fileDek = secret.recoveryWords
      ? await unlockWithRecovery(secret.recoveryWords, bundle.config)
      : await unlockWithMaster(secret.master ?? "", bundle.config);
  } catch {
    throw new Error(
      secret.recoveryWords
        ? "Invalid recovery key for this backup file."
        : "Wrong master password for this backup file.",
    );
  }

  // Phase 1: decrypt EVERYTHING in memory (atomic - one bad item aborts all).
  const decrypted: {
    id: string;
    type: VaultItemType;
    favorite: boolean;
    data: Record<string, unknown>;
  }[] = [];
  for (const it of bundle.items) {
    const data = await decryptJSON<Record<string, unknown>>(
      { iv: it.iv, ct: it.ct },
      fileDek,
    );
    decrypted.push({ id: it.id, type: it.type, favorite: it.favorite, data });
  }

  // Phase 2: re-encrypt under the live DEK and upsert by id (idempotent).
  const rows = await Promise.all(
    decrypted.map(async (d) => {
      const blob = await encryptJSON(d.data, currentDek);
      return {
        id: d.id,
        type: d.type,
        favorite: d.favorite,
        encrypted_data: blob.ct,
        iv: blob.iv,
      };
    }),
  );

  if (rows.length > 0) {
    const { error } = await supabase()
      .from("vault_items")
      .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
    await loadItems(currentDek); // refresh the in-RAM store
  }

  return { imported: rows.length, total: bundle.items.length };
}
