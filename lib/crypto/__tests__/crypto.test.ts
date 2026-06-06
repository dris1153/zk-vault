import { describe, it, expect } from "vitest";
import {
  createVault,
  unlockWithMaster,
  unlockWithRecovery,
  changeMaster,
  rotateRecovery,
  deriveAuthSecret,
  authSalt,
  encryptJSON,
  decryptJSON,
  generateRecoveryWords,
  normalizeRecoveryPhrase,
  isValidRecoveryPhrase,
  bytesEqual,
} from "../index";
import type { VaultConfigCrypto } from "../index";

// Light Argon2 cost so the suite runs fast. Production uses DEFAULT_KDF / AUTH_KDF.
const FAST = { memKiB: 1024, iterations: 1, parallelism: 1 };
const MASTER = "correct-horse-battery-staple";
const EMAIL = "me@example.com";

async function rawKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

describe("AES-GCM round-trip", () => {
  it("encrypts and decrypts a complex object", async () => {
    const { dek } = await createVault(MASTER, EMAIL, FAST);
    const item = {
      title: "GitHub",
      username: "octocat",
      password: "hunter2-Xq9!",
      tags: ["work", "personal"],
      nested: { a: 1, b: [true, null, "x"] },
    };
    const blob = await encryptJSON(item, dek);
    expect(blob.iv).toBeTruthy();
    expect(blob.ct).toBeTruthy();
    expect(JSON.stringify(blob)).not.toContain("hunter2");
    const back = await decryptJSON(blob, dek);
    expect(back).toEqual(item);
  });

  it("produces a unique IV per encryption", async () => {
    const { dek } = await createVault(MASTER, EMAIL, FAST);
    const a = await encryptJSON({ x: 1 }, dek);
    const b = await encryptJSON({ x: 1 }, dek);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ct).not.toEqual(b.ct);
  });

  it("rejects tampered ciphertext", async () => {
    const { dek } = await createVault(MASTER, EMAIL, FAST);
    const blob = await encryptJSON({ secret: "value" }, dek);
    const bytes = atob(blob.ct);
    const arr = Uint8Array.from(bytes, (c) => c.charCodeAt(0));
    arr[0] ^= 0xff; // flip a byte
    let tamperedB64 = "";
    for (const byte of arr) tamperedB64 += String.fromCharCode(byte);
    const tampered = { iv: blob.iv, ct: btoa(tamperedB64) };
    await expect(decryptJSON(tampered, dek)).rejects.toThrow();
  });
});

describe("master unlock", () => {
  it("unlocks with the correct password and yields the same DEK", async () => {
    const { config, dek } = await createVault(MASTER, EMAIL, FAST);
    const unlocked = await unlockWithMaster(MASTER, config);
    expect(bytesEqual(await rawKey(dek), await rawKey(unlocked))).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const { config } = await createVault(MASTER, EMAIL, FAST);
    await expect(unlockWithMaster("wrong-password", config)).rejects.toThrow();
  });
});

describe("recovery key", () => {
  it("generates a valid 24-word phrase", () => {
    const words = generateRecoveryWords();
    expect(words).toHaveLength(24);
    expect(isValidRecoveryPhrase(words)).toBe(true);
  });

  it("rejects an invalid phrase", () => {
    expect(isValidRecoveryPhrase(["not", "a", "real", "phrase"])).toBe(false);
    expect(() => normalizeRecoveryPhrase(["bogus"])).toThrow();
  });

  it("recovery unlock yields the same DEK as master unlock", async () => {
    const { config, dek, recoveryWords } = await createVault(MASTER, EMAIL, FAST);
    const viaRecovery = await unlockWithRecovery(recoveryWords, config);
    expect(bytesEqual(await rawKey(dek), await rawKey(viaRecovery))).toBe(true);
  });

  it("rejects recovery words from a different vault", async () => {
    const a = await createVault(MASTER, EMAIL, FAST);
    const b = await createVault(MASTER, EMAIL, FAST);
    await expect(unlockWithRecovery(b.recoveryWords, a.config)).rejects.toThrow();
  });

  it("unlocks despite uppercase and stray whitespace in recovery words", async () => {
    const { config, dek, recoveryWords } = await createVault(MASTER, EMAIL, FAST);
    const messy = recoveryWords.map((w, i) => (i % 2 === 0 ? w.toUpperCase() : w));
    messy[0] = "  " + messy[0];
    messy[messy.length - 1] = messy[messy.length - 1] + "  ";
    const unlocked = await unlockWithRecovery(messy, config);
    expect(bytesEqual(await rawKey(dek), await rawKey(unlocked))).toBe(true);
  });
});

describe("change master", () => {
  it("re-wraps the DEK without touching items, old password stops working", async () => {
    const created = await createVault(MASTER, EMAIL, FAST);
    const dek = created.dek;

    // Encrypt an item under the original DEK.
    const blob = await encryptJSON({ note: "stable" }, dek);

    const NEW = "a-brand-new-master-2026";
    const result = await changeMaster(dek, NEW, EMAIL, created.config, FAST);

    // Auth secret rotates with the master password.
    expect(result.authSecret).not.toEqual(created.authSecret);

    const updated: VaultConfigCrypto = {
      version: created.config.version,
      kdfParams: result.kdfParams,
      wrappedDekMaster: result.wrappedDekMaster,
      wrappedDekRecovery: created.config.wrappedDekRecovery,
    };

    // Old password no longer unlocks.
    await expect(unlockWithMaster(MASTER, updated)).rejects.toThrow();

    // New password unlocks the SAME DEK; the old item still decrypts.
    const reDek = await unlockWithMaster(NEW, updated);
    expect(bytesEqual(await rawKey(dek), await rawKey(reDek))).toBe(true);
    expect(await decryptJSON(blob, reDek)).toEqual({ note: "stable" });

    // Recovery key still works after master change.
    const viaRecovery = await unlockWithRecovery(created.recoveryWords, updated);
    expect(bytesEqual(await rawKey(dek), await rawKey(viaRecovery))).toBe(true);
  });
});

describe("rotate recovery key", () => {
  it("new words unlock the same DEK; old words fail; master is unaffected", async () => {
    const created = await createVault(MASTER, EMAIL, FAST);
    const dek = created.dek;
    const blob = await encryptJSON({ note: "stable" }, dek);

    const result = await rotateRecovery(dek, created.config);

    // Fresh words; only saltRecovery rotates (saltMaster preserved).
    expect(result.recoveryWords).toHaveLength(24);
    expect(result.recoveryWords).not.toEqual(created.recoveryWords);
    expect(result.kdfParams.saltMaster).toEqual(
      created.config.kdfParams.saltMaster,
    );
    expect(result.kdfParams.saltRecovery).not.toEqual(
      created.config.kdfParams.saltRecovery,
    );

    const updated: VaultConfigCrypto = {
      version: created.config.version,
      kdfParams: result.kdfParams,
      wrappedDekMaster: created.config.wrappedDekMaster, // untouched
      wrappedDekRecovery: result.wrappedDekRecovery,
    };

    // New recovery words unlock the SAME DEK and decrypt the old item.
    const viaNew = await unlockWithRecovery(result.recoveryWords, updated);
    expect(bytesEqual(await rawKey(dek), await rawKey(viaNew))).toBe(true);
    expect(await decryptJSON(blob, viaNew)).toEqual({ note: "stable" });

    // Old recovery words no longer unlock.
    await expect(
      unlockWithRecovery(created.recoveryWords, updated),
    ).rejects.toThrow();

    // Master password still unlocks the same DEK.
    const viaMaster = await unlockWithMaster(MASTER, updated);
    expect(bytesEqual(await rawKey(dek), await rawKey(viaMaster))).toBe(true);
  });
});

describe("auth secret (email-derived)", () => {
  it("is deterministic per (password,email) and password/email specific", async () => {
    const s1 = await deriveAuthSecret(MASTER, EMAIL, FAST);
    const s2 = await deriveAuthSecret(MASTER, EMAIL, FAST);
    const sPw = await deriveAuthSecret("different", EMAIL, FAST);
    const sEmail = await deriveAuthSecret(MASTER, "other@example.com", FAST);
    expect(s1).toEqual(s2);
    expect(s1).not.toEqual(sPw);
    expect(s1).not.toEqual(sEmail);
  });

  it("normalizes the email (case/whitespace) to a stable salt", async () => {
    expect(await authSalt("Me@Example.com")).toEqual(await authSalt("  me@example.com  "));
  });
});

describe("domain separation", () => {
  it("auth salt is independent from the random KEK salts", async () => {
    const { config } = await createVault(MASTER, EMAIL, FAST);
    const { saltMaster, saltRecovery } = config.kdfParams;
    const aSalt = await authSalt(EMAIL);
    expect(saltMaster).not.toEqual(saltRecovery);
    expect(aSalt).not.toEqual(saltMaster);
    expect(aSalt).not.toEqual(saltRecovery);
  });
});

describe("payload edge cases", () => {
  it("round-trips empty, unicode, and large payloads", async () => {
    const { dek } = await createVault(MASTER, EMAIL, FAST);
    const values: unknown[] = [
      "",
      "pé\u{1F510} key",
      "x".repeat(50000),
      { a: "\u{1F512}", b: null, c: [1, 2, 3] },
    ];
    for (const v of values) {
      const blob = await encryptJSON(v, dek);
      expect(await decryptJSON(blob, dek)).toEqual(v);
    }
  });

  it("throws on malformed ciphertext and wrong IV length", async () => {
    const { dek } = await createVault(MASTER, EMAIL, FAST);
    await expect(
      decryptJSON({ iv: "AAAAAAAAAAAAAAAA", ct: "!!!notbase64" }, dek),
    ).rejects.toThrow();
    const ok = await encryptJSON({ x: 1 }, dek);
    await expect(decryptJSON({ iv: "AA", ct: ok.ct }, dek)).rejects.toThrow();
  });
});
