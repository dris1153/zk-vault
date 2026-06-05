// Orchestration: ties crypto + Supabase + in-RAM stores into the
// provision/unlock/lock lifecycle. Browser-only.

import { unlockWithMaster } from "@/lib/crypto";
import { provisionVault, authenticate } from "@/lib/supabase/provisioning";
import { useSession } from "./session";
import { loadItems, clearItems } from "./items-store";
import { markProvisioned } from "./provisioned-flag";

/** First run: create the vault, then unlock. Returns recovery words (show once). */
export async function createVaultAndUnlock(
  email: string,
  masterPassword: string,
): Promise<string[]> {
  useSession.getState().setUnlocking();
  try {
    const { dek, recoveryWords } = await provisionVault(email, masterPassword);
    markProvisioned();
    useSession.getState().setUnlocked(dek);
    await loadItems(dek);
    return recoveryWords;
  } catch (err) {
    useSession.getState().reset();
    throw err;
  }
}

/** Returning user: authenticate (no DB read for the salt), then unwrap + load. */
export async function unlock(
  email: string,
  masterPassword: string,
): Promise<void> {
  useSession.getState().setUnlocking();
  try {
    const cfg = await authenticate(email, masterPassword);
    const dek = await unlockWithMaster(masterPassword, cfg);
    useSession.getState().setUnlocked(dek);
    await loadItems(dek);
  } catch (err) {
    useSession.getState().reset();
    throw err;
  }
}

/** Lock: wipe the DEK and all decrypted items from RAM. */
export function lock(): void {
  clearItems();
  useSession.getState().reset();
}
