// Pure client-side decoder for Google Authenticator "Transfer accounts" QR
// exports (`otpauth-migration://offline?data=...`). Hand-written protobuf wire
// reader so there is no external protobufjs dependency.

import * as OTPAuth from "otpauth";

export type MigrationAlgorithm = "SHA1" | "SHA256" | "SHA512" | "MD5";

export interface MigratedOtp {
  secret: string; // RFC 4648 base32
  issuer: string;
  account: string;
  algorithm: MigrationAlgorithm;
  digits: number;
  period?: number;
  type: "totp" | "hotp";
  counter: number;
}

export interface MigrationBatch {
  otps: MigratedOtp[];
  version: number;
  batchSize: number;
  batchIndex: number;
  batchId: number;
}

export function isMigrationUri(input: string): boolean {
  return /^otpauth-migration:\/\/offline/i.test(input.trim());
}

const ALG_BY_CODE: Record<number, MigrationAlgorithm> = {
  0: "SHA1",
  1: "SHA1",
  2: "SHA256",
  3: "SHA512",
  4: "MD5",
};

const utf8 = new TextDecoder();

function decodeBase64Data(raw: string): Uint8Array {
  // URLSearchParams decodes unescaped `+` as space; restore `+` and URL-safe chars.
  let b64 = raw.trim().replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function readVarint(buf: Uint8Array, start: number, end: number): [bigint, number] {
  let pos = start;
  let result = 0n;
  let shift = 0n;
  while (pos < end) {
    const b = buf[pos++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) return [result, pos];
    shift += 7n;
    if (shift > 70n) throw new Error("Protobuf varint overflow");
  }
  throw new Error("Truncated protobuf varint");
}

function readBytes(buf: Uint8Array, start: number, end: number): [Uint8Array, number] {
  const [lenBig, pos] = readVarint(buf, start, end);
  const len = Number(lenBig);
  if (len < 0 || pos + len > end) {
    throw new Error("Truncated protobuf length-delimited field");
  }
  return [buf.subarray(pos, pos + len), pos + len];
}

function skipField(
  buf: Uint8Array,
  start: number,
  end: number,
  wireType: number,
): number {
  switch (wireType) {
    case 0:
      return readVarint(buf, start, end)[1];
    case 1:
      if (start + 8 > end) throw new Error("Truncated 64-bit protobuf field");
      return start + 8;
    case 2:
      return readBytes(buf, start, end)[1];
    case 5:
      if (start + 4 > end) throw new Error("Truncated 32-bit protobuf field");
      return start + 4;
    default:
      throw new Error(`Unsupported protobuf wire type: ${wireType}`);
  }
}

function splitName(rawName: string, rawIssuer: string): { issuer: string; account: string } {
  const issuer = rawIssuer.trim();
  const name = rawName.trim();
  const colonIdx = name.indexOf(":");
  if (colonIdx !== -1) {
    const prefix = name.slice(0, colonIdx).trim();
    const rest = name.slice(colonIdx + 1).trim();
    if (!issuer) return { issuer: prefix, account: rest };
    if (prefix.toLowerCase() === issuer.toLowerCase()) {
      return { issuer, account: rest };
    }
    return { issuer, account: name };
  }
  if (!issuer) return { issuer: name, account: "" };
  return { issuer, account: name };
}

function parseOtpParameters(buf: Uint8Array): MigratedOtp | null {
  let pos = 0;
  const end = buf.length;
  let secretBytes: Uint8Array | null = null;
  let rawName = "";
  let rawIssuer = "";
  let algCode = 1;
  let digitsCode = 1;
  let typeCode = 2;
  let counter = 0;

  while (pos < end) {
    const [tagBig, nextPos] = readVarint(buf, pos, end);
    pos = nextPos;
    const tag = Number(tagBig);
    const field = tag >>> 3;
    const wire = tag & 0x7;

    if (field === 1 && wire === 2) {
      [secretBytes, pos] = readBytes(buf, pos, end);
    } else if (field === 2 && wire === 2) {
      const [bytes, p] = readBytes(buf, pos, end);
      rawName = utf8.decode(bytes);
      pos = p;
    } else if (field === 3 && wire === 2) {
      const [bytes, p] = readBytes(buf, pos, end);
      rawIssuer = utf8.decode(bytes);
      pos = p;
    } else if (field === 4 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      algCode = Number(v);
      pos = p;
    } else if (field === 5 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      digitsCode = Number(v);
      pos = p;
    } else if (field === 6 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      typeCode = Number(v);
      pos = p;
    } else if (field === 7 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      counter = Number(v);
      pos = p;
    } else {
      pos = skipField(buf, pos, end, wire);
    }
  }

  if (!secretBytes || secretBytes.length === 0) return null;

  const secret = new OTPAuth.Secret({
    buffer: secretBytes.buffer.slice(
      secretBytes.byteOffset,
      secretBytes.byteOffset + secretBytes.byteLength,
    ) as ArrayBuffer,
  }).base32;

  const { issuer, account } = splitName(rawName, rawIssuer);

  return {
    secret,
    issuer: issuer || "Không tiêu đề",
    account,
    algorithm: ALG_BY_CODE[algCode] ?? "SHA1",
    digits: digitsCode === 2 ? 8 : 6,
    type: typeCode === 1 ? "hotp" : "totp",
    counter,
  };
}

/** Decode a single Google Authenticator migration QR URI. */
export function parseMigrationUri(uri: string): MigrationBatch {
  const trimmed = uri.trim();
  if (!isMigrationUri(trimmed)) {
    throw new Error("Không phải mã QR xuất từ Google Authenticator.");
  }
  let dataParam: string | null = null;
  try {
    dataParam = new URL(trimmed).searchParams.get("data");
  } catch {
    throw new Error("URI migration không hợp lệ.");
  }
  if (!dataParam) {
    throw new Error("Thiếu dữ liệu trong mã QR migration.");
  }

  const buf = decodeBase64Data(dataParam);
  let pos = 0;
  const end = buf.length;
  const otps: MigratedOtp[] = [];
  let version = 1;
  let batchSize = 1;
  let batchIndex = 0;
  let batchId = 0;

  while (pos < end) {
    const [tagBig, nextPos] = readVarint(buf, pos, end);
    pos = nextPos;
    const tag = Number(tagBig);
    const field = tag >>> 3;
    const wire = tag & 0x7;

    if (field === 1 && wire === 2) {
      const [entryBytes, p] = readBytes(buf, pos, end);
      pos = p;
      const parsed = parseOtpParameters(entryBytes);
      if (parsed) otps.push(parsed);
    } else if (field === 2 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      version = Number(BigInt.asIntN(32, v));
      pos = p;
    } else if (field === 3 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      batchSize = Math.max(1, Number(BigInt.asIntN(32, v)));
      pos = p;
    } else if (field === 4 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      batchIndex = Math.max(0, Number(BigInt.asIntN(32, v)));
      pos = p;
    } else if (field === 5 && wire === 0) {
      const [v, p] = readVarint(buf, pos, end);
      batchId = Number(BigInt.asIntN(32, v));
      pos = p;
    } else {
      pos = skipField(buf, pos, end, wire);
    }
  }

  return { otps, version, batchSize, batchIndex, batchId };
}

/** Format a MigratedOtp into a secret or percent-encoded otpauth:// URI for storage. */
export function toOtpauthUri(o: MigratedOtp): string {
  const period = o.period && o.period > 0 ? o.period : 30;
  if (o.digits === 6 && o.algorithm === "SHA1" && period === 30) {
    return o.secret;
  }
  const label = o.issuer
    ? o.account
      ? `${o.issuer}:${o.account}`
      : o.issuer
    : o.account || "Account";
  const parts = [
    `secret=${encodeURIComponent(o.secret)}`,
    `algorithm=${encodeURIComponent(o.algorithm)}`,
    `digits=${encodeURIComponent(String(o.digits))}`,
  ];
  if (period !== 30) parts.push(`period=${encodeURIComponent(String(period))}`);
  if (o.issuer) parts.push(`issuer=${encodeURIComponent(o.issuer)}`);
  return `otpauth://totp/${encodeURIComponent(label)}?${parts.join("&")}`;
}
