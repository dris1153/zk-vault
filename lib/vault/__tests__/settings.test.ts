import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../settings";

const store = new Map<string, string>();
const origWindow = globalThis.window;
const origStorage = globalThis.localStorage;

beforeEach(() => {
  store.clear();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;

  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    value: origWindow,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: origStorage,
    configurable: true,
    writable: true,
  });
});

describe("vault settings", () => {
  it("returns defaults when empty", () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("migrates legacy lockOnHidden boolean to lockOnHiddenAfterMs", () => {
    localStorage.setItem("vault.settings", JSON.stringify({ lockOnHidden: false }));
    expect(loadSettings().lockOnHiddenAfterMs).toBe(-1);

    localStorage.setItem("vault.settings", JSON.stringify({ lockOnHidden: true }));
    expect(loadSettings().lockOnHiddenAfterMs).toBe(60_000);
  });

  it("preserves explicit lockOnHiddenAfterMs and hideCodes overrides", () => {
    saveSettings({ lockOnHiddenAfterMs: 0, hideCodes: true });
    const loaded = loadSettings();
    expect(loaded.lockOnHiddenAfterMs).toBe(0);
    expect(loaded.hideCodes).toBe(true);
  });

  it("clamps or falls back on invalid/corrupted localStorage values", () => {
    localStorage.setItem(
      "vault.settings",
      JSON.stringify({
        autoLockMs: 0,
        lockOnHiddenAfterMs: -99,
        clipboardClearSeconds: "bad",
        hideCodes: "yes",
      }),
    );
    const loaded = loadSettings();
    expect(loaded.autoLockMs).toBe(DEFAULT_SETTINGS.autoLockMs);
    expect(loaded.lockOnHiddenAfterMs).toBe(DEFAULT_SETTINGS.lockOnHiddenAfterMs);
    expect(loaded.clipboardClearSeconds).toBe(DEFAULT_SETTINGS.clipboardClearSeconds);
    expect(loaded.hideCodes).toBe(false);
  });
});
