// Single-user auth. The "password" passed here is the derived authSecret
// (base64 Argon2id output) - never the raw master password.

import { supabase, VAULT_EMAIL } from "./client";

function requireEmail(): string {
  if (!VAULT_EMAIL) throw new Error("Missing NEXT_PUBLIC_VAULT_EMAIL");
  return VAULT_EMAIL;
}

/** Create the single account (first run). Idempotent-ish: throws if it exists. */
export async function signUpVault(authSecret: string): Promise<void> {
  const { error } = await supabase().auth.signUp({
    email: requireEmail(),
    password: authSecret,
  });
  if (error) throw error;
}

/** Sign in with the derived authSecret. */
export async function signInVault(authSecret: string): Promise<void> {
  const { error } = await supabase().auth.signInWithPassword({
    email: requireEmail(),
    password: authSecret,
  });
  if (error) throw error;
}

export async function signOutVault(): Promise<void> {
  await supabase().auth.signOut();
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase().auth.getUser();
  return data.user?.id ?? null;
}

/** Rotate the Supabase Auth password (used by change-master). Requires a session. */
export async function updateAuthSecret(authSecret: string): Promise<void> {
  const { error } = await supabase().auth.updateUser({ password: authSecret });
  if (error) throw error;
}
