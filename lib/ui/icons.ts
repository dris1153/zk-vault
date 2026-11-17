// Type -> Phosphor icon + label. SSR import avoids client-context requirements.

import {
  UserCircle,
  ShieldCheck,
  Wallet,
  TerminalWindow,
  NoteBlank,
  Key,
  Database,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { VaultItemType } from "@/lib/supabase/types";

export const TYPE_ICON: Record<VaultItemType, Icon> = {
  login: UserCircle,
  authenticator: ShieldCheck,
  wallet: Wallet,
  ssh_key: TerminalWindow,
  database: Database,
  secure_note: NoteBlank,
  api_key: Key,
};

export const TYPE_LABEL: Record<VaultItemType, string> = {
  login: "Đăng nhập",
  authenticator: "Mã 2FA",
  wallet: "Ví crypto",
  ssh_key: "SSH Key",
  database: "Database",
  secure_note: "Ghi chú",
  api_key: "API Key",
};

export const TYPE_ORDER: VaultItemType[] = [
  "login",
  "authenticator",
  "wallet",
  "ssh_key",
  "database",
  "secure_note",
  "api_key",
];
