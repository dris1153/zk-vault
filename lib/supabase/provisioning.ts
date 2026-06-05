// First-run provisioning + unlock orchestration glue (the parts that touch
// Supabase). Pure key handling stays in lib/crypto; session/state lands in
// Phase 3. Everything here runs in the browser only.

import {
  createVault,
  deriveAuthSecret,
  type KdfTuning,
  type VaultConfigCrypto,
} from "@/lib/crypto";
import { signUpVault, signInVault, currentUserId } from "./auth";
import { getVaultConfig, insertVaultConfig } from "./vault-config";
import { setVaultEmail } from "@/lib/vault/identity";

export interface ProvisionResult {
  dek: CryptoKey;
  recoveryWords: string[];
}

/** Has THIS browser session already got an authenticated vault config? */
export async function hasVaultConfig(): Promise<boolean> {
  return (await getVaultConfig()) !== null;
}

/**
 * First run: create the envelope locally, register the Supabase account with
 * the derived auth secret, sign in, then persist the (ciphertext) config.
 * Returns the in-RAM DEK and the recovery words to show the user once.
 */
export async function provisionVault(
  email: string,
  masterPassword: string,
  tuning?: KdfTuning,
): Promise<ProvisionResult> {
  setVaultEmail(email); // identity must be set before any sign-up/sign-in
  const created = await createVault(masterPassword, email, tuning);
  await signUpVault(created.authSecret);
  // signUp may already create a session; signIn guarantees one (email-confirm off).
  await signInVault(created.authSecret);

  const userId = await currentUserId();
  if (!userId) {
    throw new Error(
      "No session after sign-up. Disable email confirmation in Supabase Auth settings (see supabase/README.md).",
    );
  }
  await insertVaultConfig(userId, created.config);
  return { dek: created.dek, recoveryWords: created.recoveryWords };
}

/**
 * Returning user: derive auth secret from (master + email) WITHOUT a DB read,
 * sign in, then fetch the ciphertext config. Phase 3 unwraps the DEK from it.
 */
export async function authenticate(
  email: string,
  masterPassword: string,
  tuning?: KdfTuning,
): Promise<VaultConfigCrypto> {
  setVaultEmail(email); // identity must be set before sign-in
  const authSecret = await deriveAuthSecret(masterPassword, email, tuning);
  await signInVault(authSecret);
  const cfg = await getVaultConfig();
  if (!cfg) throw new Error("Authenticated but no vault config found");
  return cfg;
}
