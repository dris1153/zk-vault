// Argon2id key derivation (hash-wasm).
//
// Two independent derivations from the master password:
//   - authSecret : Argon2id(master, salt = SHA-256(email)) with FIXED AUTH_KDF
//     cost. Becomes the Supabase Auth password. Email-derived salt + fixed cost
//     mean it is computable from (master + email) ALONE - no DB read needed,
//     which breaks the "read config before you can auth" circular dependency.
//   - KEK : Argon2id(master | recoveryPhrase, salt = saltMaster | saltRecovery)
//     using the vault's stored KdfParams cost. Wraps the DEK. Random salts.
// Distinct salts (email-hash vs random) keep authSecret and KEK independent.

import { argon2id } from "hash-wasm";
import { ab, base64ToBytes, bytesToBase64, utf8 } from "./encoding";
import type { KdfParams, KdfTuning } from "./types";

/** Production KEK cost. Tune up as hardware allows. */
export const DEFAULT_KDF = {
  memKiB: 65536,
  iterations: 3,
  parallelism: 1,
} as const;

/** Fixed auth cost (must stay constant so login is reproducible without a DB read). */
export const AUTH_KDF = DEFAULT_KDF;

const HASH_LENGTH = 32; // 256-bit

interface Costs {
  memKiB: number;
  iterations: number;
  parallelism: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Deterministic 16-byte salt from the account email (public, salt-only use). */
export async function authSalt(email: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    ab(utf8.encode(normalizeEmail(email))),
  );
  return bytesToBase64(new Uint8Array(digest).slice(0, 16));
}

async function argon(
  password: string,
  saltB64: string,
  c: Costs,
): Promise<Uint8Array> {
  const hash = await argon2id({
    password,
    salt: base64ToBytes(saltB64),
    parallelism: c.parallelism,
    iterations: c.iterations,
    memorySize: c.memKiB,
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
  return importAesKey(await argon(password, salt, p));
}

/**
 * Derive the base64 Supabase Auth password from (master password + email).
 * Uses the email-derived salt and the fixed AUTH_KDF cost (or `tuning` in tests),
 * so it never depends on stored vault config.
 */
export async function deriveAuthSecret(
  password: string,
  email: string,
  tuning?: KdfTuning,
): Promise<string> {
  const c: Costs = { ...AUTH_KDF, ...tuning };
  return bytesToBase64(await argon(password, await authSalt(email), c));
}
