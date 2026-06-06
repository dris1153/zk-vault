// Read/write the single vault_config row. Requires an authenticated session
// (RLS scopes everything to auth.uid()).

import { supabase } from "./client";
import type {
  VaultConfigCrypto,
  ChangeMasterResult,
  RotateRecoveryResult,
  KdfParams,
} from "@/lib/crypto";
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
 *
 * Change-master only OWNS `saltMaster` + `wrapped_dek_master`, so we re-read the
 * live kdf_params and merge just `saltMaster` - never writing back a (possibly
 * stale) saltRecovery that a concurrent rotate-recovery may have rotated. This
 * keeps saltRecovery in sync with wrapped_dek_recovery (symmetric to
 * updateRecoveryWrap). The revert path passes the OLD saltMaster, so it still
 * correctly rolls saltMaster back.
 */
export async function updateMasterWrap(
  userId: string,
  change: Pick<ChangeMasterResult, "kdfParams" | "wrappedDekMaster">,
): Promise<void> {
  const { data, error: readErr } = await supabase()
    .from(TABLE)
    .select("kdf_params")
    .eq("user_id", userId)
    .single();
  if (readErr) throw readErr;

  const live = (data as { kdf_params: KdfParams }).kdf_params;
  const merged: KdfParams = {
    ...live,
    saltMaster: change.kdfParams.saltMaster,
  };

  const { error } = await supabase()
    .from(TABLE)
    .update({
      kdf_params: merged,
      wrapped_dek_master: change.wrappedDekMaster,
    })
    .eq("user_id", userId);
  if (error) throw error;
}

/**
 * Persist the recovery-key rotation from rotateRecovery(). Rotation only OWNS
 * `saltRecovery` + `wrapped_dek_recovery`, so we re-read the live kdf_params and
 * merge just `saltRecovery` into it - never writing back a (possibly stale)
 * saltMaster that a concurrent change-master may have rotated. This keeps
 * saltMaster in sync with wrapped_dek_master and avoids a master-unlock brick.
 */
export async function updateRecoveryWrap(
  userId: string,
  change: Pick<RotateRecoveryResult, "kdfParams" | "wrappedDekRecovery">,
): Promise<void> {
  const { data, error: readErr } = await supabase()
    .from(TABLE)
    .select("kdf_params")
    .eq("user_id", userId)
    .single();
  if (readErr) throw readErr;

  const live = (data as { kdf_params: KdfParams }).kdf_params;
  const merged: KdfParams = {
    ...live,
    saltRecovery: change.kdfParams.saltRecovery,
  };

  const { error } = await supabase()
    .from(TABLE)
    .update({
      kdf_params: merged,
      wrapped_dek_recovery: change.wrappedDekRecovery,
    })
    .eq("user_id", userId);
  if (error) throw error;
}
