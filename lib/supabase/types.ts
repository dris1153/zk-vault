// Row shapes for the two vault tables. Sensitive fields are ciphertext only.

import type { KdfParams, WrappedKey } from "@/lib/crypto";

export type VaultItemType =
  | "login"
  | "wallet"
  | "ssh_key"
  | "secure_note"
  | "api_key";

export interface VaultConfigRow {
  user_id: string;
  version: number;
  kdf_params: KdfParams;
  wrapped_dek_master: WrappedKey;
  wrapped_dek_recovery: WrappedKey;
  created_at: string;
  updated_at: string;
}

export interface VaultItemRow {
  id: string;
  user_id: string;
  type: VaultItemType;
  favorite: boolean;
  encrypted_data: string; // base64 AES-GCM ciphertext
  iv: string; // base64
  created_at: string;
  updated_at: string;
}
