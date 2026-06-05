"use client";

// Runtime vault email: the auth-secret salt + Supabase login identifier. Sourced
// from user input + localStorage (key "vault-email") instead of a build-time env
// var. The email is NOT a secret - storing it locally is fine.

const KEY = "vault-email";

export function getVaultEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setVaultEmail(email: string): void {
  if (typeof window === "undefined") return;
  // Canonicalize to match the auth-secret salt (kdf normalizes trim+lowercase),
  // so the Supabase login id and the salt are provably the same string.
  localStorage.setItem(KEY, email.trim().toLowerCase());
}

export function clearVaultEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
