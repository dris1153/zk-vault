// Change the master password: verify current, re-wrap the DEK, rotate the
// Supabase Auth password.
//
// Auth-password rotation and the DB wrap write cannot be one transaction, so on
// failure we PROBE the real server auth state (instead of blindly rolling back)
// and converge to a consistent pair. We never report "reverted" unless the old
// password is verified to still work. Worst case is surfaced honestly: the
// recovery key + encrypted backup are always a valid escape hatch (the recovery
// wrap is never touched here).

import {
  changeMaster,
  unlockWithMaster,
  deriveAuthSecret,
} from "@/lib/crypto";
import { VAULT_EMAIL } from "@/lib/supabase/client";
import { currentUserId, updateAuthSecret, signInVault } from "@/lib/supabase/auth";
import { getVaultConfig, updateMasterWrap } from "@/lib/supabase/vault-config";
import { useSession } from "./session";

async function canSignIn(authSecret: string): Promise<boolean> {
  try {
    await signInVault(authSecret);
    return true;
  } catch {
    return false;
  }
}

export async function changeMasterPassword(
  currentMaster: string,
  newMaster: string,
): Promise<void> {
  const dek = useSession.getState().dek;
  if (!dek) throw new Error("Vault is locked");

  const cfg = await getVaultConfig();
  if (!cfg) throw new Error("No vault config found");

  // Verify the current master by unwrapping (throws on wrong password).
  await unlockWithMaster(currentMaster, cfg);

  const userId = await currentUserId();
  if (!userId) throw new Error("Not signed in");

  const oldAuth = await deriveAuthSecret(currentMaster, VAULT_EMAIL);
  const result = await changeMaster(dek, newMaster, VAULT_EMAIL, cfg);

  // 1) Write the new wrap first (safe to fail: nothing else changed yet).
  await updateMasterWrap(userId, result);

  // 2) Rotate the auth password.
  try {
    await updateAuthSecret(result.authSecret);
    return; // wrap=new, auth=new -> consistent
  } catch {
    // The throw may be a real failure OR a lost response after success.
    // Probe the actual server state and converge.
    if (await canSignIn(result.authSecret)) {
      return; // auth actually applied; wrap=new, auth=new -> consistent
    }
    if (await canSignIn(oldAuth)) {
      // Auth is still old, but wrap is new -> mismatch. Revert the wrap.
      await updateMasterWrap(userId, {
        kdfParams: cfg.kdfParams,
        wrappedDekMaster: cfg.wrappedDekMaster,
      });
      throw new Error(
        "Could not update the login password. The change was reverted - your current master password still works.",
      );
    }
    // Indeterminate: leave wrap=new (do NOT brick it further). Recovery key works.
    throw new Error(
      "The master change was only partially applied. Try unlocking with your NEW master password. If that fails, restore from your encrypted backup using your recovery key. Do NOT discard your recovery key.",
    );
  }
}
