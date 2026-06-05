// Single-user auth. The "password" passed here is the derived authSecret
// (base64 Argon2id output) - never the raw master password.

import { supabase } from "./client";
import { getVaultEmail } from "@/lib/vault/identity";

function requireEmail(): string {
  const email = getVaultEmail();
  if (!email) throw new Error("Chưa có email vault. Nhập email để mở khóa.");
  return email;
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
