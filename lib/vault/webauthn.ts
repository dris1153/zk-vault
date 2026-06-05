// Raw WebAuthn (PRF extension) + a tiny IndexedDB store for the biometric record.
// Browser-only, no dependency. There is no server attestation verification - this
// is a local-only flow, so the challenge is a local random value.

import { randomBytes } from "@/lib/crypto";
import type { EncryptedBlob } from "@/lib/crypto";
import { getVaultEmail } from "./identity";

export class BiometricUnsupportedError extends Error {}

// The DOM lib does not fully type the PRF extension; cast at the boundary.
type PrfInputs = { prf: { eval?: { first: BufferSource } } };
type PrfResults = {
  prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
};

export interface BiometricRecord {
  id: "default";
  credentialId: string; // base64
  prfSalt: string; // base64
  wrapped: EncryptedBlob;
  rpId: string;
  createdAt: string;
}

// ---------- IndexedDB ----------
const DB_NAME = "vault-biometric";
const STORE = "cred";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const txn = db.transaction(STORE, mode);
        const req = fn(txn.objectStore(STORE));
        let result: T;
        req.onsuccess = () => {
          result = req.result as T;
        };
        // Resolve on transaction completion (write durability), not request success.
        txn.oncomplete = () => resolve(result);
        txn.onerror = () => reject(txn.error);
        txn.onabort = () => reject(txn.error);
      }).finally(() => db.close()),
  );
}

export async function saveBiometric(rec: BiometricRecord): Promise<void> {
  await run("readwrite", (s) => s.put(rec));
}
export async function getBiometric(): Promise<BiometricRecord | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    return (
      (await run<BiometricRecord | undefined>("readonly", (s) =>
        s.get("default"),
      )) ?? null
    );
  } catch {
    return null;
  }
}
export async function clearBiometric(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await run("readwrite", (s) => s.delete("default"));
  } catch {
    // best-effort; never block the caller (e.g. change-master)
  }
}
export async function hasBiometric(): Promise<boolean> {
  return (await getBiometric()) !== null;
}

// ---------- WebAuthn ----------
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Re-derive the PRF output for a saved credential (used by enroll + unlock). */
export async function getPrfOutput(
  credentialId: BufferSource,
  prfSalt: Uint8Array,
): Promise<ArrayBuffer> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: location.hostname,
      allowCredentials: [{ id: credentialId, type: "public-key" }],
      userVerification: "required",
      extensions: { prf: { eval: { first: prfSalt } } } as PrfInputs,
    },
  })) as PublicKeyCredential | null;
  if (!assertion) throw new Error("Biometric was cancelled");
  const out = assertion.getClientExtensionResults() as PrfResults;
  const first = out.prf?.results?.first;
  if (!first) throw new BiometricUnsupportedError("PRF output unavailable");
  return first;
}

/** Register a platform credential and return its first PRF output + salt. */
export async function enrollCredential(): Promise<{
  credentialId: ArrayBuffer;
  prfSalt: Uint8Array;
  prfOutput: ArrayBuffer;
}> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { id: location.hostname, name: "Vault" },
      user: {
        id: randomBytes(16),
        name: getVaultEmail() ?? "vault",
        displayName: "Vault",
      },
      challenge: randomBytes(32),
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      attestation: "none",
      extensions: { prf: {} } as PrfInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Enrollment was cancelled");

  const ext = cred.getClientExtensionResults() as PrfResults;
  if (ext.prf?.enabled !== true) {
    throw new BiometricUnsupportedError(
      "This device/browser does not support the WebAuthn PRF extension",
    );
  }
  const prfSalt = randomBytes(32);
  const prfOutput = await getPrfOutput(cred.rawId, prfSalt);
  return { credentialId: cred.rawId, prfSalt, prfOutput };
}
