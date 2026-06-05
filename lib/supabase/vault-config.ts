// Read/write the single vault_config row. Requires an authenticated session
// (RLS scopes everything to auth.uid()).

import { supabase } from "./client";
import type { VaultConfigCrypto, ChangeMasterResult } from "@/lib/crypto";
import type { VaultConfigRow } from "./types";

const TABLE = "vault_config";

function rowToConfig(row: VaultConfigRow): VaultConfigCrypto {
  return {
    version: row.version,
    kdfParams: row.kdf_params,
    wrappedDekMaster: row.wrapped_dek_master,
    wrappedDekRecovery: row.wrapped_dek_recovery,
  };
}

/** The current user's vault config, or null if none exists yet. */
export async function getVaultConfig(): Promise<VaultConfigCrypto | null> {
  const { data, error } = await supabase()
    .from(TABLE)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? rowToConfig(data as VaultConfigRow) : null;
}

export async function insertVaultConfig(
  userId: string,
  cfg: VaultConfigCrypto,
): Promise<void> {
  const { error } = await supabase().from(TABLE).insert({
    user_id: userId,
    version: cfg.version,
    kdf_params: cfg.kdfParams,
    wrapped_dek_master: cfg.wrappedDekMaster,
    wrapped_dek_recovery: cfg.wrappedDekRecovery,
  });
  if (error) throw error;
}

/**
 * Persist the master-wrap rotation from changeMaster(). Call updateAuthSecret()
 * in the same flow - both must succeed together (see crypto changeMaster doc).
 */
export async function updateMasterWrap(
  userId: string,
  change: Pick<ChangeMasterResult, "kdfParams" | "wrappedDekMaster">,
): Promise<void> {
  const { error } = await supabase()
    .from(TABLE)
    .update({
      kdf_params: change.kdfParams,
      wrapped_dek_master: change.wrappedDekMaster,
    })
    .eq("user_id", userId);
  if (error) throw error;
}
