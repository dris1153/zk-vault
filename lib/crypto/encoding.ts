// Portable binary <-> base64 helpers + CSPRNG. Works in browser and Node 18+.
// Uses Web Crypto + btoa/atob globals (available in both environments).

export const utf8 = new TextEncoder();
export const utf8dec = new TextDecoder();

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

// Normalize any Uint8Array to an ArrayBuffer-backed copy. Web Crypto's
// BufferSource requires Uint8Array<ArrayBuffer> under TS 5.7+; values coming
// from TextEncoder / hash-wasm may be typed as ArrayBufferLike.
export function ab(b: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(b);
}

// Constant-time-ish equality for tests/assertions over raw key material.
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
