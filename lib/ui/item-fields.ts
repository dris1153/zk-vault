// Field layout per item type. Drives BOTH the add/edit form and the detail
// panel/sheet, so they never drift. `secret` fields render masked with a reveal
// toggle; `seed_phrase` gets the numbered word grid in detail.

import type { VaultItemType } from "@/lib/supabase/types";
import { engineLabel } from "./db-engines";
import { oauthProviderLabel } from "./oauth-providers";

export type FieldKind =
  | "text"
  | "secret"
  | "textarea"
  | "tags"
  | "platform"
  | "totp"
  | "db_engine"
  | "service"
  | "auth_method"
  | "oauth_provider";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  // When set, the field shows in the form + detail only if this returns true.
  visibleWhen?: (data: Record<string, unknown>) => boolean;
}

const isOAuth = (d: Record<string, unknown>) => d.auth_method === "oauth";

const title: FieldDef = { name: "title", label: "Tiêu đề", kind: "text" };
const notes: FieldDef = { name: "notes", label: "Ghi chú", kind: "textarea" };
const tags: FieldDef = { name: "tags", label: "Tags", kind: "tags" };

export const FIELDS_BY_TYPE: Record<VaultItemType, FieldDef[]> = {
  login: [
    title,
    { name: "auth_method", label: "Phương thức", kind: "auth_method" },
    { name: "url", label: "Nền tảng / URL", kind: "platform" },
    // Credential mode
    { name: "username", label: "Username", kind: "text", visibleWhen: (d) => !isOAuth(d) },
    { name: "password", label: "Mật khẩu", kind: "secret", visibleWhen: (d) => !isOAuth(d) },
    {
      name: "totp_secret",
      label: "Mã 2FA (secret hoặc otpauth://)",
      kind: "totp",
      visibleWhen: (d) => !isOAuth(d),
    },
    // OAuth mode
    { name: "oauth_provider", label: "Đăng nhập qua", kind: "oauth_provider", visibleWhen: isOAuth },
    {
      name: "oauth_account",
      label: "Tài khoản (email/username)",
      kind: "text",
      visibleWhen: isOAuth,
    },
    notes,
    tags,
  ],
  authenticator: [
    { name: "title", label: "Dịch vụ / Nền tảng", kind: "text" },
    { name: "account", label: "Tài khoản (email / username)", kind: "text" },
    {
      name: "totp_secret",
      label: "Mã 2FA (secret hoặc otpauth://)",
      kind: "totp",
    },
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
    { name: "content", label: "Nội dung", kind: "textarea" },
    tags,
  ],
  api_key: [
    title,
    { name: "service", label: "Dịch vụ", kind: "service" },
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

const pick = (data: Record<string, unknown>, k: string) =>
  typeof data[k] === "string" ? (data[k] as string) : "";

/** Secondary line shown on the item row/card (masked secrets stay hidden). */
export function cardSubtitle(type: VaultItemType, data: Record<string, unknown>): string {
  switch (type) {
    case "login":
      return data.auth_method === "oauth"
        ? pick(data, "oauth_account") || oauthProviderLabel(pick(data, "oauth_provider"))
        : pick(data, "username") || pick(data, "url");
    case "authenticator":
      return pick(data, "account") || "Mã 2FA";
    case "wallet":
      return [pick(data, "network"), pick(data, "address")].filter(Boolean).join(" · ");
    case "ssh_key":
      return [pick(data, "username"), pick(data, "host")].filter(Boolean).join(" @ ");
    case "api_key":
      return pick(data, "service");
    case "database":
      return [engineLabel(pick(data, "engine")), pick(data, "host")]
        .filter(Boolean)
        .join(" · ");
    case "secure_note":
      return "Ghi chú bảo mật";
  }
}

/** Primary secret for inline 1-click copy on Vault rows. */
export function primarySecretField(
  type: VaultItemType,
  data: Record<string, unknown>,
): { field: string; label: string; value: string } | null {
  switch (type) {
    case "login": {
      if (data.auth_method === "oauth") return null;
      const v = pick(data, "password");
      return v ? { field: "password", label: "mật khẩu", value: v } : null;
    }
    case "authenticator": {
      const v = pick(data, "totp_secret");
      return v ? { field: "totp_secret", label: "secret 2FA", value: v } : null;
    }
    case "wallet": {
      const pk = pick(data, "private_key");
      if (pk) return { field: "private_key", label: "private key", value: pk };
      const seed = pick(data, "seed_phrase");
      return seed ? { field: "seed_phrase", label: "seed phrase", value: seed } : null;
    }
    case "ssh_key": {
      const v = pick(data, "private_key");
      return v ? { field: "private_key", label: "private key", value: v } : null;
    }
    case "api_key": {
      const v = pick(data, "key");
      return v ? { field: "key", label: "API key", value: v } : null;
    }
    case "database": {
      const v = pick(data, "password");
      return v ? { field: "password", label: "mật khẩu DB", value: v } : null;
    }
    case "secure_note": {
      const v = pick(data, "content");
      return v ? { field: "content", label: "nội dung", value: v } : null;
    }
  }
}
