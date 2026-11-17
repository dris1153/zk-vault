// Vault behavior settings. Persisted to localStorage (non-secret preferences only).

const KEY = "vault.settings";

export interface VaultSettings {
  autoLockMs: number; // idle timeout before auto-lock (>= 60s)
  lockOnHiddenAfterMs: number; // -1 = off, 0 = immediate, >0 = grace period ms
  clipboardClearSeconds: number; // wipe clipboard after copy (>= 5s)
  hideCodes: boolean; // blur 2FA codes until tapped
  fetchFavicons: boolean; // OFF: custom-domain icons leak the domain to a third party
  breachCheckEnabled: boolean; // OFF: HIBP check sends a 5-char hash prefix to a third party
  lastExportAt?: string; // ISO timestamp of the last successful .vault export
}

export const DEFAULT_SETTINGS: VaultSettings = {
  autoLockMs: 5 * 60 * 1000,
  lockOnHiddenAfterMs: 60 * 1000,
  clipboardClearSeconds: 20,
  hideCodes: false,
  fetchFavicons: false,
  breachCheckEnabled: false,
};

type LegacySettings = Record<string, unknown>;

function validInt(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max
    ? Math.trunc(v)
    : fallback;
}

function validBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function loadSettings(): VaultSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as LegacySettings;
    if (!parsed || typeof parsed !== "object") return DEFAULT_SETTINGS;

    const legacyHidden = parsed.lockOnHidden;
    const hiddenMsFallback =
      legacyHidden === false ? -1 : DEFAULT_SETTINGS.lockOnHiddenAfterMs;

    return {
      autoLockMs: validInt(
        parsed.autoLockMs,
        60_000,
        24 * 60 * 60_000,
        DEFAULT_SETTINGS.autoLockMs,
      ),
      lockOnHiddenAfterMs: validInt(
        parsed.lockOnHiddenAfterMs,
        -1,
        24 * 60 * 60_000,
        hiddenMsFallback,
      ),
      clipboardClearSeconds: validInt(
        parsed.clipboardClearSeconds,
        5,
        300,
        DEFAULT_SETTINGS.clipboardClearSeconds,
      ),
      hideCodes: validBool(parsed.hideCodes, DEFAULT_SETTINGS.hideCodes),
      fetchFavicons: validBool(
        parsed.fetchFavicons,
        DEFAULT_SETTINGS.fetchFavicons,
      ),
      breachCheckEnabled: validBool(
        parsed.breachCheckEnabled,
        DEFAULT_SETTINGS.breachCheckEnabled,
      ),
      lastExportAt:
        typeof parsed.lastExportAt === "string"
          ? parsed.lastExportAt
          : undefined,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(patch: Partial<VaultSettings>): VaultSettings {
  const next = { ...loadSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
