// Envelope (key-wrapping) scheme.
//
//   DEK = random 256-bit data-encryption-key (encrypts every vault item).
//   DEK is wrapped twice: by KEK_master (from master password) and by
//   KEK_recovery (from the 24-word recovery key). Supabase stores both wrapped
//   copies. Changing the master password only re-wraps the DEK - items are
//   never re-encrypted.

import { DEFAULT_KDF, deriveKEK, deriveAuthSecret } from "./kdf";
import { encryptBytes, decryptBytes } from "./aes";
import { ab, bytesToBase64, randomBytes } from "./encoding";
import { generateRecoveryWords, normalizeRecoveryPhrase } from "./recovery-key";
import type {
  KdfParams,
  KdfTuning,
  VaultConfigCrypto,
  CreatedVault,
  ChangeMasterResult,
} from "./types";

const SALT_BYTES = 16;
const DEK_BYTES = 32;

function freshParams(tuning?: KdfTuning): KdfParams {
  return {
    algo: "argon2id",
    memKiB: tuning?.memKiB ?? DEFAULT_KDF.memKiB,
    iterations: tuning?.iterations ?? DEFAULT_KDF.iterations,
    parallelism: tuning?.parallelism ?? DEFAULT_KDF.parallelism,
    saltAuth: bytesToBase64(randomBytes(SALT_BYTES)),
    saltMaster: bytesToBase64(randomBytes(SALT_BYTES)),
    saltRecovery: bytesToBase64(randomBytes(SALT_BYTES)),
  };
}

// DEK is extractable so it can be re-wrapped (change master) and held in RAM.
function importDek(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", ab(raw), { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function exportDek(dek: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", dek));
}

/** First-run provisioning: generates salts, DEK, and recovery key. */
export async function createVault(
  masterPassword: string,
  tuning?: KdfTuning,
): Promise<CreatedVault> {
  const kdfParams = freshParams(tuning);
  const dekRaw = randomBytes(DEK_BYTES);
  const recoveryWords = generateRecoveryWords();

  const kekMaster = await deriveKEK(masterPassword, kdfParams, "master");
  const kekRecovery = await deriveKEK(
    recoveryWords.join(" "),
    kdfParams,
    "recovery",
  );

  const [wrappedDekMaster, wrappedDekRecovery, authSecret] = await Promise.all([
    encryptBytes(dekRaw, kekMaster),
    encryptBytes(dekRaw, kekRecovery),
    deriveAuthSecret(masterPassword, kdfParams),
  ]);

  return {
    config: { kdfParams, wrappedDekMaster, wrappedDekRecovery },
    dek: await importDek(dekRaw),
    recoveryWords,
    authSecret,
  };
}

/** Unlock with the master password. Throws on wrong password (GCM auth tag). */
export async function unlockWithMaster(
  masterPassword: string,
  cfg: VaultConfigCrypto,
): Promise<CryptoKey> {
  const kek = await deriveKEK(masterPassword, cfg.kdfParams, "master");
  const dekRaw = await decryptBytes(cfg.wrappedDekMaster, kek);
  return importDek(dekRaw);
}

/** Unlock with the 24-word recovery key. Throws on invalid/incorrect words. */
export async function unlockWithRecovery(
  words: string[],
  cfg: VaultConfigCrypto,
): Promise<CryptoKey> {
  const phrase = normalizeRecoveryPhrase(words);
  const kek = await deriveKEK(phrase, cfg.kdfParams, "recovery");
  const dekRaw = await decryptBytes(cfg.wrappedDekRecovery, kek);
  return importDek(dekRaw);
}

/** Re-derive the Supabase Auth password for an already-derived config. */
export async function authSecretFor(
  masterPassword: string,
  cfg: VaultConfigCrypto,
): Promise<string> {
  return deriveAuthSecret(masterPassword, cfg.kdfParams);
}

/**
 * Change the master password: rotate saltAuth + saltMaster and re-wrap the DEK.
 * Recovery key and all encrypted items remain untouched.
 */
export async function changeMaster(
  dek: CryptoKey,
  newPassword: string,
  cfg: VaultConfigCrypto,
): Promise<ChangeMasterResult> {
  const dekRaw = await exportDek(dek);
  const kdfParams: KdfParams = {
    ...cfg.kdfParams,
    saltAuth: bytesToBase64(randomBytes(SALT_BYTES)),
    saltMaster: bytesToBase64(randomBytes(SALT_BYTES)),
  };
  const kek = await deriveKEK(newPassword, kdfParams, "master");
  const [wrappedDekMaster, authSecret] = await Promise.all([
    encryptBytes(dekRaw, kek),
    deriveAuthSecret(newPassword, kdfParams),
  ]);
  return { kdfParams, wrappedDekMaster, authSecret };
}
