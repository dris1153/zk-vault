"use client";

// Mounts the auto-lock watcher with the user's current settings and hydrates
// persisted preferences. State lives in Zustand stores, so no context value.

import { useEffect } from "react";
import { useAutoLock } from "@/lib/vault/auto-lock";
import { useSettings, hydrateSettings } from "@/lib/vault/settings-store";

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { autoLockMs, lockOnHidden } = useSettings((s) => s.settings);

  useEffect(() => hydrateSettings(), []);
  useAutoLock(autoLockMs, lockOnHidden);

  return <>{children}</>;
}
