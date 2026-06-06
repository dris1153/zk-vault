// Envelope (key-wrapping) scheme.
//
//   DEK = random 256-bit data-encryption-key (encrypts every vault item).
//   DEK is wrapped twice: by KEK_master (from master password) and by
//   KEK_recovery (from the 24-word recovery key). Supabase stores both wrapped
//   copies. Changing the master password only re-wraps the DEK - items are
//   never re-encrypted.
//
// The Supabase Auth password (authSecret) is derived separately from
// (master + email); see kdf.ts. It is NOT part of KdfParams.

import { DEFAULT_KDF, deriveKEK, deriveAuthSecret } from "./kdf";
import { encryptBytes, decryptBytes } from "./aes";
import { ab, bytesToBase64, randomBytes, bytesEqual } from "./encoding";
import { generateRecoveryWords, normalizeRecoveryPhrase } from "./recovery-key";
import type {
  KdfParams,
  KdfTuning,
  VaultConfigCrypto,
  CreatedVault,
  ChangeMasterResult,
  RotateRecoveryResult,
} from "./types";

const SALT_BYTES = 16;
const DEK_BYTES = 32;
export const ENVELOPE_VERSION = 1;

function freshParams(tuning?: KdfTuning): KdfParams {
  return {
    algo: "argon2id",
    memKiB: tuning?.memKiB ?? DEFAULT_KDF.memKiB,
    iterations: tuning?.iterations ?? DEFAULT_KDF.iterations,
    parallelism: tuning?.parallelism ?? DEFAULT_KDF.parallelism,
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
  email: string,
  tuning?: KdfTuning,
): Promise<CreatedVault> {
  const kdfParams = freshParams(tuning);
  const dekRaw = randomBytes(DEK_BYTES);
  const recoveryWords = generateRecoveryWords();
  // Derive the recovery KEK from the SAME normalized phrase that unlock uses,
  // so the recovery wrap is always unwrappable. Never feed raw words to the KDF.
  const recoveryPhrase = normalizeRecoveryPhrase(recoveryWords);

  const kekMaster = await deriveKEK(masterPassword, kdfParams, "master");
  const kekRecovery = await deriveKEK(recoveryPhrase, kdfParams, "recovery");

  const [wrappedDekMaster, wrappedDekRecovery, authSecret] = await Promise.all([
    encryptBytes(dekRaw, kekMaster),
    encryptBytes(dekRaw, kekRecovery),
    deriveAuthSecret(masterPassword, email, tuning),
  ]);

  const dek = await importDek(dekRaw);
  dekRaw.fill(0); // best-effort scrub of raw key material from the heap

  return {
    config: {
      version: ENVELOPE_VERSION,
      kdfParams,
      wrappedDekMaster,
      wrappedDekRecovery,
    },
    dek,
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
  const dek = await importDek(dekRaw);
  dekRaw.fill(0);
  return dek;
}

/** Unlock with the 24-word recovery key. Throws on invalid/incorrect words. */
export async function unlockWithRecovery(
  words: string[],
  cfg: VaultConfigCrypto,
): Promise<CryptoKey> {
  const phrase = normalizeRecoveryPhrase(words);
  const kek = await deriveKEK(phrase, cfg.kdfParams, "recovery");
  const dekRaw = await decryptBytes(cfg.wrappedDekRecovery, kek);
  const dek = await importDek(dekRaw);
  dekRaw.fill(0);
  return dek;
}

/**
 * Change the master password: rotate saltMaster and re-wrap the DEK; re-derive
 * the auth secret. Recovery key and all encrypted items remain untouched.
 *
 * PERSISTENCE CONTRACT: the caller MUST persist both results
 * (kdfParams, wrappedDekMaster) atomically together with the Supabase Auth
 * password update (authSecret). A partial write bricks the vault.
 */
export async function changeMaster(
  dek: CryptoKey,
  newPassword: string,
  email: string,
  cfg: VaultConfigCrypto,
  tuning?: KdfTuning,
): Promise<ChangeMasterResult> {
  const dekRaw = await exportDek(dek);
  const kdfParams: KdfParams = {
    ...cfg.kdfParams,
    saltMaster: bytesToBase64(randomBytes(SALT_BYTES)),
  };
  const kek = await deriveKEK(newPassword, kdfParams, "master");
  const [wrappedDekMaster, authSecret] = await Promise.all([
    encryptBytes(dekRaw, kek),
    deriveAuthSecret(newPassword, email, tuning),
  ]);
  dekRaw.fill(0);
  return { kdfParams, wrappedDekMaster, authSecret };
}

/**
 * Rotate the recovery key: generate fresh 24 words, rotate saltRecovery, and
 * re-wrap the DEK under the new recovery KEK. The master wrap, the DEK itself,
 * the auth secret, and all encrypted items are untouched.
 *
 * Only ONE field group changes server-side (kdfParams + wrappedDekRecovery), so
 * the caller's single update is atomic - there is no partial-brick window, and a
 * failed write simply leaves the OLD recovery key valid. saltMaster is preserved
 * so master unlock keeps working.
 */
export async function rotateRecovery(
  dek: CryptoKey,
  cfg: VaultConfigCrypto,
): Promise<RotateRecoveryResult> {
  const dekRaw = await exportDek(dek);
  const recoveryWords = generateRecoveryWords();
  // Same normalized phrase that unlock uses, so the new wrap is unwrappable.
  const recoveryPhrase = normalizeRecoveryPhrase(recoveryWords);
  const kdfParams: KdfParams = {
    ...cfg.kdfParams,
    saltRecovery: bytesToBase64(randomBytes(SALT_BYTES)),
  };
  const kek = await deriveKEK(recoveryPhrase, kdfParams, "recovery");
  const wrappedDekRecovery = await encryptBytes(dekRaw, kek);

  // Self-check: unwrap the fresh wrap and confirm it reproduces the DEK before
  // we ever hand it back to be persisted (guards against a silent brick).
  const check = await decryptBytes(wrappedDekRecovery, kek);
  const ok = bytesEqual(check, dekRaw);
  check.fill(0);
  dekRaw.fill(0);
  if (!ok) throw new Error("Recovery rotation self-check failed");

  return { kdfParams, wrappedDekRecovery, recoveryWords };
}
