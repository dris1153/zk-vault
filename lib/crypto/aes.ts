// AES-256-GCM via native Web Crypto. Every encryption uses a fresh random IV.
// The GCM auth tag makes decryption throw on any tampering or wrong key.

import {
  ab,
  base64ToBytes,
  bytesToBase64,
  randomBytes,
  utf8,
  utf8dec,
} from "./encoding";
import type { EncryptedBlob } from "./types";

const IV_BYTES = 12;

export async function encryptBytes(
  plain: Uint8Array,
  key: CryptoKey,
): Promise<EncryptedBlob> {
  const iv = randomBytes(IV_BYTES);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    ab(plain),
  );
  return { iv: bytesToBase64(iv), ct: bytesToBase64(new Uint8Array(ct)) };
}

export async function decryptBytes(
  blob: EncryptedBlob,
  key: CryptoKey,
): Promise<Uint8Array> {
  const iv = base64ToBytes(blob.iv);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBytes(blob.ct),
  );
  return new Uint8Array(pt);
}

export async function encryptJSON(
  obj: unknown,
  key: CryptoKey,
): Promise<EncryptedBlob> {
  return encryptBytes(utf8.encode(JSON.stringify(obj)), key);
}

export async function decryptJSON<T = unknown>(
  blob: EncryptedBlob,
  key: CryptoKey,
): Promise<T> {
  const bytes = await decryptBytes(blob, key);
  return JSON.parse(utf8dec.decode(bytes)) as T;
}
