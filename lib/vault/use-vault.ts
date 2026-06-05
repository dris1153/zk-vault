// Primary hook for vault UI. Exposes session status + lifecycle actions.

"use client";

import { useSession, type VaultStatus } from "./session";
import { createVaultAndUnlock, unlock, lock } from "./actions";

export interface UseVault {
  status: VaultStatus;
  dek: CryptoKey | null;
  unlock: (email: string, masterPassword: string) => Promise<void>;
  createVault: (email: string, masterPassword: string) => Promise<string[]>;
  lock: () => void;
}

export function useVault(): UseVault {
  const status = useSession((s) => s.status);
  const dek = useSession((s) => s.dek);
  return {
    status,
    dek,
    unlock,
    createVault: createVaultAndUnlock,
    lock,
  };
}
