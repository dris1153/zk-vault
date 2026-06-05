// Crypto domain types. All binary values are base64-encoded strings so they
// can be stored as JSON in Supabase without binary columns.

export interface KdfParams {
  algo: "argon2id";
  memKiB: number; // Argon2 memory cost in KiB
  iterations: number; // Argon2 time cost
  parallelism: number; // Argon2 lanes
  saltAuth: string; // base64 (16 bytes) - derives the Supabase Auth secret
  saltMaster: string; // base64 (16 bytes) - derives KEK that wraps the DEK
  saltRecovery: string; // base64 (16 bytes) - derives KEK from the recovery key
}

export interface EncryptedBlob {
  iv: string; // base64 (12 bytes)
  ct: string; // base64 (ciphertext + GCM auth tag)
}

export type WrappedKey = EncryptedBlob;

/** Everything Supabase stores in the vault_config row (all non-secret/ciphertext). */
export interface VaultConfigCrypto {
  kdfParams: KdfParams;
  wrappedDekMaster: WrappedKey;
  wrappedDekRecovery: WrappedKey;
}

/** Optional KDF cost overrides (used by tests to keep Argon2 fast). */
export type KdfTuning = Partial<
  Pick<KdfParams, "memKiB" | "iterations" | "parallelism">
>;

export interface CreatedVault {
  config: VaultConfigCrypto;
  dek: CryptoKey; // lives in RAM only
  recoveryWords: string[]; // 24 words, shown to the user exactly once
  authSecret: string; // base64, used as the Supabase Auth password
}

export interface ChangeMasterResult {
  kdfParams: KdfParams; // new saltAuth + saltMaster (recovery untouched)
  wrappedDekMaster: WrappedKey; // DEK re-wrapped under the new master KEK
  authSecret: string; // new Supabase Auth password
}
