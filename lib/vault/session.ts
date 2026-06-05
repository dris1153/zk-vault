// In-RAM vault session. The DEK lives ONLY here and is never persisted
// (no Zustand persist middleware, no localStorage). Cleared on lock.

import { create } from "zustand";

export type VaultStatus = "locked" | "unlocking" | "unlocked";

interface SessionState {
  dek: CryptoKey | null;
  status: VaultStatus;
  setUnlocking: () => void;
  setUnlocked: (dek: CryptoKey) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  dek: null,
  status: "locked",
  setUnlocking: () => set({ status: "unlocking" }),
  setUnlocked: (dek) => set({ dek, status: "unlocked" }),
  reset: () => set({ dek: null, status: "locked" }),
}));
