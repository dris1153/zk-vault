// Reactive settings so changes apply immediately (e.g. auto-lock timeout).
// Starts from DEFAULT_SETTINGS for stable SSR, then hydrates from localStorage.

import { create } from "zustand";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type VaultSettings,
} from "./settings";

interface SettingsState {
  settings: VaultSettings;
  update: (patch: Partial<VaultSettings>) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  update: (patch) => set({ settings: saveSettings(patch) }),
}));

/** Call once on the client to load persisted overrides. */
export function hydrateSettings(): void {
  useSettings.setState({ settings: loadSettings() });
}
