// Recovery key = a 24-word BIP39 mnemonic (256-bit entropy). The mnemonic
// string itself is fed into Argon2id(saltRecovery) to derive KEK_recovery,
// which wraps a second copy of the DEK. Losing the master password but keeping
// these words still recovers the vault.

import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

/** Generate 24 recovery words (256-bit entropy). */
export function generateRecoveryWords(): string[] {
  return generateMnemonic(wordlist, 256).split(" ");
}

/**
 * Canonicalize user-entered words and validate the BIP39 checksum.
 * NFKD-normalizes to match BIP39's own canonicalization, then lowercases and
 * collapses whitespace. The SAME normalized string is used to derive the
 * recovery KEK on both create and unlock - never feed raw words to the KDF.
 */
export function normalizeRecoveryPhrase(words: string[]): string {
  const phrase = words
    .join(" ")
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!validateMnemonic(phrase, wordlist)) {
    throw new Error("Invalid recovery phrase");
  }
  return phrase;
}

/** Validate without throwing (for live form feedback). */
export function isValidRecoveryPhrase(words: string[]): boolean {
  try {
    normalizeRecoveryPhrase(words);
    return true;
  } catch {
    return false;
  }
}
