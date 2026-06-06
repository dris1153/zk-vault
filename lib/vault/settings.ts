// Vault behavior settings. Defaults here; Phase 6 wires a settings UI that
// persists user overrides to localStorage (non-secret preferences only).

const KEY = "vault.settings";

export interface VaultSettings {
  autoLockMs: number; // idle timeout before auto-lock
  lockOnHidden: boolean; // lock when the tab is hidden
  clipboardClearSeconds: number; // wipe clipboard after copy
  fetchFavicons: boolean; // OFF: custom-domain icons leak the domain to a third party
  breachCheckEnabled: boolean; // OFF: HIBP check sends a 5-char hash prefix to a third party
  lastExportAt?: string; // ISO timestamp of the last successful .vault export
}

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMs: 5 * 60 * 1000,
  lockOnHidden: true,
  clipboardClearSeconds: 20,
  fetchFavicons: false,
  breachCheckEnabled: false,
};

export function loadSettings(): VaultSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<VaultSettings>) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(patch: Partial<VaultSettings>): VaultSettings {
  const next = { ...loadSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
