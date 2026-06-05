// Type -> Phosphor icon + label. SSR import avoids client-context requirements.

import {
  UserCircle,
  Wallet,
  TerminalWindow,
  NoteBlank,
  Key,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { VaultItemType } from "@/lib/supabase/types";

export const TYPE_ICON: Record<VaultItemType, Icon> = {
  login: UserCircle,
  wallet: Wallet,
  ssh_key: TerminalWindow,
  secure_note: NoteBlank,
  api_key: Key,
};

export const TYPE_LABEL: Record<VaultItemType, string> = {
  login: "Login",
  wallet: "Wallet",
  ssh_key: "SSH Key",
  secure_note: "Secure Note",
  api_key: "API Key",
};

export const TYPE_ORDER: VaultItemType[] = [
  "login",
  "wallet",
  "ssh_key",
  "secure_note",
  "api_key",
];
