// Per-type item schemas. The validated object is what gets JSON-encrypted into
// `encrypted_data`. `type` and `favorite` live as plaintext columns separately.

import { z } from "zod";
import type { VaultItemType } from "@/lib/supabase/types";

const tags = z.array(z.string()).default([]);
const title = z.string().min(1, "Title is required");

export const loginSchema = z.object({
  title,
  username: z.string().default(""),
  password: z.string().default(""),
  url: z.string().optional(),
  totp_secret: z.string().optional(), // wired in v1.5
  notes: z.string().optional(),
  tags,
});

export const walletSchema = z.object({
  title,
  network: z.string().default(""),
  address: z.string().default(""),
  private_key: z.string().default(""),
  seed_phrase: z.string().optional(),
  derivation_path: z.string().optional(),
  notes: z.string().optional(),
  tags,
});

export const sshKeySchema = z.object({
  title,
  host: z.string().optional(),
  username: z.string().optional(),
  private_key: z.string().default(""),
  public_key: z.string().optional(),
  passphrase: z.string().optional(),
  notes: z.string().optional(),
  tags,
});

export const secureNoteSchema = z.object({
  title,
  content: z.string().default(""),
  tags,
});

export const apiKeySchema = z.object({
  title,
  service: z.string().default(""),
  key: z.string().default(""),
  secret: z.string().optional(),
  notes: z.string().optional(),
  tags,
});

export const databaseSchema = z.object({
  title,
  engine: z.string().default(""),
  host: z.string().default(""),
  port: z.string().optional(),
  database: z.string().optional(),
  username: z.string().default(""),
  password: z.string().default(""),
  notes: z.string().optional(),
  tags,
});

export const schemaByType: Record<VaultItemType, z.ZodTypeAny> = {
  login: loginSchema,
  wallet: walletSchema,
  ssh_key: sshKeySchema,
  secure_note: secureNoteSchema,
  api_key: apiKeySchema,
  database: databaseSchema,
};

export type ItemData = Record<string, unknown>;

/** Validate + normalize the payload for a given item type. Throws on invalid. */
export function parseItemData(type: VaultItemType, data: unknown): ItemData {
  return schemaByType[type].parse(data) as ItemData;
}
