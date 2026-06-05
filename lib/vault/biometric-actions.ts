// Biometric lifecycle: enable (wrap DEK+authSecret under the PRF key), unlock,
// disable. Reuses the lib/crypto public API only. Browser-only.

import {
  encryptJSON,
  decryptJSON,
  deriveAuthSecret,
  unlockWithMaster,
  bytesToBase64,
  base64ToBytes,
} from "@/lib/crypto";
import { signInVault } from "@/lib/supabase/auth";
import { getVaultConfig } from "@/lib/supabase/vault-config";
import { getVaultEmail, setVaultEmail } from "./identity";
import { useSession } from "./session";
import { loadItems } from "./items-store";
import {
  enrollCredential,
  getPrfOutput,
  getBiometric,
  saveBiometric,
  clearBiometric,
  hasBiometric,
  type BiometricRecord,
} from "./webauthn";

interface Bundle {
  dek: string; // base64 raw DEK
  authSecret: string;
  email: string; // vault email (auth salt + login id), so unlock is self-contained
}

function prfKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", prfOutput, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Enroll a device credential and store the wrapped bundle. Requires unlock + master. */
export async function enableBiometric(masterPassword: string): Promise<void> {
  const dek = useSession.getState().dek;
  if (!dek) throw new Error("Vault is locked");

  // Verify the master password BEFORE wrapping it - otherwise a typo silently
  // enrolls a bundle whose authSecret is wrong and can never sign in.
  const cfg = await getVaultConfig();
  if (!cfg) throw new Error("No vault config found");
  await unlockWithMaster(masterPassword, cfg); // throws on a wrong master

  const email = getVaultEmail();
  if (!email) throw new Error("No vault email in this session");
  const authSecret = await deriveAuthSecret(masterPassword, email);
  const dekBytes = new Uint8Array(await crypto.subtle.exportKey("raw", dek));
  const dekRaw = bytesToBase64(dekBytes);

  const { credentialId, prfSalt, prfOutput } = await enrollCredential();
  const key = await prfKey(prfOutput);
  const wrapped = await encryptJSON(
    { dek: dekRaw, authSecret, email } as Bundle,
    key,
  );
  dekBytes.fill(0); // best-effort scrub
  new Uint8Array(prfOutput).fill(0);

  const rec: BiometricRecord = {
    id: "default",
    credentialId: bytesToBase64(new Uint8Array(credentialId)),
    prfSalt: bytesToBase64(prfSalt),
    wrapped,
    rpId: location.hostname,
    createdAt: new Date().toISOString(),
  };
  await saveBiometric(rec);
}

/** Unlock using the device authenticator. Throws -> caller falls back to master. */
export async function unlockWithBiometric(): Promise<void> {
  useSession.getState().setUnlocking();
  try {
    const rec = await getBiometric();
    if (!rec) throw new Error("No biometric credential on this device");
    if (rec.rpId !== location.hostname) {
      throw new Error(
        "Biometric was set up on a different host. Use your master password.",
      );
    }

    const prfOutput = await getPrfOutput(
      base64ToBytes(rec.credentialId),
      base64ToBytes(rec.prfSalt),
    );
    const key = await prfKey(prfOutput);
    new Uint8Array(prfOutput).fill(0); // best-effort scrub
    const { dek: dekRaw, authSecret, email } = await decryptJSON<Bundle>(
      rec.wrapped,
      key,
    );
    if (!email) {
      throw new Error(
        "Biometric needs to be re-enabled (no email stored). Use your master password.",
      );
    }
    setVaultEmail(email); // restore identity before sign-in (no localStorage dependency)

    const dekBytes = base64ToBytes(dekRaw);
    const dek = await crypto.subtle.importKey(
      "raw",
      dekBytes,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"],
    );
    dekBytes.fill(0); // best-effort scrub
    await signInVault(authSecret);
    useSession.getState().setUnlocked(dek);
    await loadItems(dek);
  } catch (err) {
    useSession.getState().reset();
    throw err;
  }
}

export async function disableBiometric(): Promise<void> {
  await clearBiometric();
}

export { hasBiometric };
