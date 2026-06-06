// Rotate the 24-word recovery key (e.g. the paper was lost) without changing the
// master password. The DEK is re-wrapped under a fresh recovery KEK and a single
// vault_config update persists it - the master wrap, auth secret, and biometric
// bundle are all untouched, so there is no partial-brick window: if the write
// fails, the OLD recovery key still works.

import { rotateRecovery } from "@/lib/crypto";
import { currentUserId } from "@/lib/supabase/auth";
import { getVaultConfig, updateRecoveryWrap } from "@/lib/supabase/vault-config";
import { useSession } from "./session";

/** Returns the new 24 words to show the user once. Throws if locked/not signed in. */
export async function rotateRecoveryKey(): Promise<string[]> {
  const dek = useSession.getState().dek;
  if (!dek) throw new Error("Vault is locked");

  const cfg = await getVaultConfig();
  if (!cfg) throw new Error("No vault config found");

  const userId = await currentUserId();
  if (!userId) throw new Error("Not signed in");

  // rotateRecovery self-checks the new wrap before returning (no silent brick).
  const result = await rotateRecovery(dek, cfg);
  await updateRecoveryWrap(userId, result);
  return result.recoveryWords;
}
