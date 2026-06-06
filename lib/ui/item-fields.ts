// Field layout per item type. Drives BOTH the add/edit form and the detail
// drawer, so they never drift. `secret` fields render masked with a reveal
// toggle; `seed_phrase` gets the numbered word grid in the drawer.

import type { VaultItemType } from "@/lib/supabase/types";
import { engineLabel } from "./db-engines";

export type FieldKind =
  | "text"
  | "secret"
  | "textarea"
  | "tags"
  | "platform"
  | "totp"
  | "db_engine"
  | "service";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
}

const title: FieldDef = { name: "title", label: "Title", kind: "text" };
const notes: FieldDef = { name: "notes", label: "Notes", kind: "textarea" };
const tags: FieldDef = { name: "tags", label: "Tags", kind: "tags" };

export const FIELDS_BY_TYPE: Record<VaultItemType, FieldDef[]> = {
  login: [
    title,
    { name: "username", label: "Username", kind: "text" },
    { name: "password", label: "Password", kind: "secret" },
    { name: "url", label: "Platform / URL", kind: "platform" },
    { name: "totp_secret", label: "Mã 2FA (secret hoặc otpauth://)", kind: "totp" },
    notes,
    tags,
  ],
  wallet: [
    title,
    { name: "network", label: "Network", kind: "text" },
    { name: "address", label: "Address", kind: "text" },
    { name: "private_key", label: "Private key", kind: "secret" },
    { name: "seed_phrase", label: "Seed phrase", kind: "secret" },
    { name: "derivation_path", label: "Derivation path", kind: "text" },
    notes,
    tags,
  ],
  ssh_key: [
    title,
    { name: "host", label: "Host", kind: "text" },
    { name: "username", label: "Username", kind: "text" },
    { name: "public_key", label: "Public key", kind: "textarea" },
    { name: "private_key", label: "Private key", kind: "secret" },
    { name: "passphrase", label: "Passphrase", kind: "secret" },
    notes,
    tags,
  ],
  secure_note: [
    title,
    { name: "content", label: "Content", kind: "textarea" },
    tags,
  ],
  api_key: [
    title,
    { name: "service", label: "Service", kind: "service" },
    { name: "key", label: "Key", kind: "secret" },
    { name: "secret", label: "Secret", kind: "secret" },
    notes,
    tags,
  ],
  database: [
    title,
    { name: "engine", label: "Engine", kind: "db_engine" },
    { name: "host", label: "Host", kind: "text" },
    { name: "port", label: "Port", kind: "text" },
    { name: "database", label: "Database", kind: "text" },
    { name: "username", label: "Username", kind: "text" },
    { name: "password", label: "Password", kind: "secret" },
    notes,
    tags,
  ],
};

/** Secondary line shown on the card (masked secrets stay hidden). */
export function cardSubtitle(type: VaultItemType, data: Record<string, unknown>): string {
  const pick = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  switch (type) {
    case "login":
      return pick("username") || pick("url");
    case "wallet":
      return [pick("network"), pick("address")].filter(Boolean).join(" · ");
    case "ssh_key":
      return [pick("username"), pick("host")].filter(Boolean).join(" @ ");
    case "api_key":
      return pick("service");
    case "database":
      return [engineLabel(pick("engine")), pick("host")]
        .filter(Boolean)
        .join(" · ");
    case "secure_note":
      return "Secure note";
  }
}
