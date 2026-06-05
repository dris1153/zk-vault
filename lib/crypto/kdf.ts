// Argon2id key derivation (hash-wasm). Master password is derived into TWO
// independent secrets via domain-separated salts:
//   - authSecret (saltAuth)  -> Supabase Auth password (server-knowable)
//   - KEK        (saltMaster / saltRecovery) -> wraps the DEK (never leaves RAM)
// Distinct salts ensure the server-known authSecret cannot derive the KEK.

import { argon2id } from "hash-wasm";
import { ab, base64ToBytes, bytesToBase64 } from "./encoding";
import type { KdfParams } from "./types";

/** Production cost. ~64 MiB, tune up as hardware allows. */
export const DEFAULT_KDF = {
  memKiB: 65536,
  iterations: 3,
  parallelism: 1,
} as const;

const HASH_LENGTH = 32; // 256-bit

async function deriveRaw(
  password: string,
  saltB64: string,
  p: KdfParams,
): Promise<Uint8Array> {
  const hash = await argon2id({
    password,
    salt: base64ToBytes(saltB64),
    parallelism: p.parallelism,
    iterations: p.iterations,
    memorySize: p.memKiB,
    hashLength: HASH_LENGTH,
    outputType: "binary",
  });
  return hash as Uint8Array;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", ab(raw), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Derive the AES-GCM key-encryption-key that wraps/unwraps the DEK. */
export async function deriveKEK(
  password: string,
  p: KdfParams,
  which: "master" | "recovery",
): Promise<CryptoKey> {
  const salt = which === "master" ? p.saltMaster : p.saltRecovery;
  return importAesKey(await deriveRaw(password, salt, p));
}

/** Derive the base64 secret used as the Supabase Auth password. */
export async function deriveAuthSecret(
  password: string,
  p: KdfParams,
): Promise<string> {
  return bytesToBase64(await deriveRaw(password, p.saltAuth, p));
}
