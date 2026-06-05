// Non-secret UX hint: did this browser ever provision a vault? Decides whether
// the lock screen shows "Create vault" vs "Unlock". Security does not depend on
// it - a returning user with cleared storage can still switch to unlock mode.

const KEY = "vault.provisioned";

export function isProvisioned(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
}

export function markProvisioned(): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
}
