import { describe, it, expect } from "vitest";
import {
  createVault,
  unlockWithMaster,
  unlockWithRecovery,
  changeMaster,
  authSecretFor,
  encryptJSON,
  decryptJSON,
  generateRecoveryWords,
  normalizeRecoveryPhrase,
  isValidRecoveryPhrase,
  bytesEqual,
} from "../index";
import type { VaultConfigCrypto } from "../index";

// Light Argon2 cost so the suite runs fast. Production uses DEFAULT_KDF.
const FAST = { memKiB: 1024, iterations: 1, parallelism: 1 };
const MASTER = "correct-horse-battery-staple";

async function rawKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}

describe("AES-GCM round-trip", () => {
  it("encrypts and decrypts a complex object", async () => {
    const { dek } = await createVault(MASTER, FAST);
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
    const { dek } = await createVault(MASTER, FAST);
    const a = await encryptJSON({ x: 1 }, dek);
    const b = await encryptJSON({ x: 1 }, dek);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ct).not.toEqual(b.ct);
  });

  it("rejects tampered ciphertext", async () => {
    const { dek } = await createVault(MASTER, FAST);
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
    const { config, dek } = await createVault(MASTER, FAST);
    const unlocked = await unlockWithMaster(MASTER, config);
    expect(bytesEqual(await rawKey(dek), await rawKey(unlocked))).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const { config } = await createVault(MASTER, FAST);
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
    const { config, dek, recoveryWords } = await createVault(MASTER, FAST);
    const viaRecovery = await unlockWithRecovery(recoveryWords, config);
    expect(bytesEqual(await rawKey(dek), await rawKey(viaRecovery))).toBe(true);
  });

  it("rejects recovery words from a different vault", async () => {
    const a = await createVault(MASTER, FAST);
    const b = await createVault(MASTER, FAST);
    // b's words are valid BIP39 but wrap a different DEK / salt.
    await expect(unlockWithRecovery(b.recoveryWords, a.config)).rejects.toThrow();
  });
});

describe("change master", () => {
  it("re-wraps the DEK without touching items, old password stops working", async () => {
    const created = await createVault(MASTER, FAST);
    const dek = created.dek;

    // Encrypt an item under the original DEK.
    const blob = await encryptJSON({ note: "stable" }, dek);

    const NEW = "a-brand-new-master-2026";
    const result = await changeMaster(dek, NEW, created.config);

    const updated: VaultConfigCrypto = {
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

describe("auth secret", () => {
  it("is deterministic for a given password + params, and password-specific", async () => {
    const { config } = await createVault(MASTER, FAST);
    const s1 = await authSecretFor(MASTER, config);
    const s2 = await authSecretFor(MASTER, config);
    const s3 = await authSecretFor("different", config);
    expect(s1).toEqual(s2);
    expect(s1).not.toEqual(s3);
  });
});
