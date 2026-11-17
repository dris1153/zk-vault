import { describe, it, expect } from "vitest";
import { parseTotp } from "../totp";
import { isMigrationUri, parseMigrationUri, toOtpauthUri } from "../ga-migration";

// Minimal test-only protobuf encoder matching MigrationPayload schema.
function encodeVarint(n: number | bigint): number[] {
  let v = BigInt.asUintN(64, BigInt(n));
  const out: number[] = [];
  while (v >= 0x80n) {
    out.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  out.push(Number(v));
  return out;
}

function encodeBytes(field: number, bytes: Uint8Array): number[] {
  return [...encodeVarint((field << 3) | 2), ...encodeVarint(bytes.length), ...bytes];
}

function encodeString(field: number, str: string): number[] {
  return encodeBytes(field, new TextEncoder().encode(str));
}

function encodeInt(field: number, val: number | bigint): number[] {
  return [...encodeVarint((field << 3) | 0), ...encodeVarint(val)];
}

function encodeOtpParam(p: {
  secret: Uint8Array;
  name?: string;
  issuer?: string;
  algorithm?: number;
  digits?: number;
  type?: number;
  counter?: number | bigint;
}): Uint8Array {
  const bytes: number[] = [
    ...encodeBytes(1, p.secret),
    ...(p.name ? encodeString(2, p.name) : []),
    ...(p.issuer ? encodeString(3, p.issuer) : []),
    ...(p.algorithm !== undefined ? encodeInt(4, p.algorithm) : []),
    ...(p.digits !== undefined ? encodeInt(5, p.digits) : []),
    ...(p.type !== undefined ? encodeInt(6, p.type) : []),
    ...(p.counter !== undefined ? encodeInt(7, p.counter) : []),
  ];
  return new Uint8Array(bytes);
}

function encodePayload(opts: {
  otps: Uint8Array[];
  version?: number;
  batchSize?: number;
  batchIndex?: number;
  batchId?: number;
}): string {
  const bytes: number[] = [];
  for (const o of opts.otps) bytes.push(...encodeBytes(1, o));
  if (opts.version !== undefined) bytes.push(...encodeInt(2, opts.version));
  if (opts.batchSize !== undefined) bytes.push(...encodeInt(3, opts.batchSize));
  if (opts.batchIndex !== undefined) bytes.push(...encodeInt(4, opts.batchIndex));
  if (opts.batchId !== undefined) bytes.push(...encodeInt(5, opts.batchId));
  const b64 = Buffer.from(bytes).toString("base64");
  return `otpauth-migration://offline?data=${encodeURIComponent(b64)}`;
}

// "Hello!\xDE\xAD\xBE\xEF" -> JBSWY3DPEHPK3PXP
const SECRET_BYTES = new Uint8Array([72, 101, 108, 108, 111, 33, 222, 173, 190, 239]);
const SECRET_BASE32 = "JBSWY3DPEHPK3PXP";

describe("ga-migration", () => {
  it("detects migration URIs", () => {
    expect(isMigrationUri("otpauth-migration://offline?data=abc")).toBe(true);
    expect(isMigrationUri("otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP")).toBe(false);
  });

  it("decodes a standard TOTP migration payload", () => {
    const uri = encodePayload({
      otps: [
        encodeOtpParam({
          secret: SECRET_BYTES,
          name: "GitHub:alice@example.com",
          issuer: "GitHub",
          algorithm: 1,
          digits: 1,
          type: 2,
        }),
      ],
      version: 1,
      batchSize: 1,
      batchIndex: 0,
      batchId: 7,
    });

    const batch = parseMigrationUri(uri);
    expect(batch).toMatchObject({
      version: 1,
      batchSize: 1,
      batchIndex: 0,
      batchId: 7,
    });
    expect(batch.otps).toEqual([
      {
        secret: SECRET_BASE32,
        issuer: "GitHub",
        account: "alice@example.com",
        algorithm: "SHA1",
        digits: 6,
        type: "totp",
        counter: 0,
      },
    ]);
  });

  it("handles multi-batch metadata, 8-digit SHA256 round-trip, and HOTP entries", () => {
    const uri = encodePayload({
      otps: [
        encodeOtpParam({
          secret: SECRET_BYTES,
          name: "Acme:sec@acme.io",
          algorithm: 2, // SHA256
          digits: 2, // 8 digits
          type: 2, // TOTP
        }),
        encodeOtpParam({
          secret: SECRET_BYTES,
          name: "LegacyHOTP",
          issuer: "Legacy",
          type: 1, // HOTP
          counter: 42n,
        }),
      ],
      version: 1,
      batchSize: 3,
      batchIndex: 1,
      batchId: 42,
    });

    const batch = parseMigrationUri(uri);
    expect(batch.batchSize).toBe(3);
    expect(batch.batchIndex).toBe(1);
    expect(batch.batchId).toBe(42);
    expect(batch.otps[0]).toMatchObject({
      issuer: "Acme",
      account: "sec@acme.io",
      algorithm: "SHA256",
      digits: 8,
      type: "totp",
    });
    expect(batch.otps[1]).toMatchObject({
      issuer: "Legacy",
      account: "LegacyHOTP",
      type: "hotp",
      counter: 42,
    });

    // Non-default digits/algorithm serialize as full otpauth:// URI and round-trip via parseTotp.
    const stored = toOtpauthUri(batch.otps[0]);
    expect(stored.startsWith("otpauth://totp/")).toBe(true);
    const parsed = parseTotp(stored)!;
    expect(parsed.digits).toBe(8);
    expect(parsed.algorithm).toBe("SHA256");
    expect(parsed.secret.base32).toBe(SECRET_BASE32);

    // Spaces in issuer use %20 (never '+') and custom period survives round-trip.
    const spaced = toOtpauthUri({
      secret: SECRET_BASE32,
      issuer: "Google Workspace",
      account: "alice@acme.io",
      algorithm: "SHA256",
      digits: 6,
      period: 60,
      type: "totp",
      counter: 0,
    });
    expect(spaced).not.toContain("+");
    const parsedSpaced = parseTotp(spaced)!;
    expect(parsedSpaced.issuer).toBe("Google Workspace");
    expect(parsedSpaced.period).toBe(60);

    // Default 6-digit SHA1 30s stores bare base32 secret.
    expect(
      toOtpauthUri({
        secret: SECRET_BASE32,
        issuer: "GitHub",
        account: "alice",
        algorithm: "SHA1",
        digits: 6,
        type: "totp",
        counter: 0,
      }),
    ).toBe(SECRET_BASE32);
  });

  it("handles URL-safe base64 and unescaped '+' spaces", () => {
    const rawUri = encodePayload({
      otps: [
        encodeOtpParam({
          secret: SECRET_BYTES,
          name: "Cloudflare:me@cf.dev",
          issuer: "Cloudflare",
        }),
      ],
    });
    const encoded = decodeURIComponent(rawUri.split("data=")[1]);
    const urlSafe = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(parseMigrationUri(`otpauth-migration://offline?data=${urlSafe}`).otps[0].secret).toBe(
      SECRET_BASE32,
    );

    // Unescaped '+' in query string turns into ' ' under URLSearchParams.
    const unescapedPlus = `otpauth-migration://offline?data=${encoded}`;
    expect(parseMigrationUri(unescapedPlus).otps[0].secret).toBe(SECRET_BASE32);
  });

  it("rejects invalid URIs", () => {
    expect(() => parseMigrationUri("https://example.com")).toThrow();
    expect(() => parseMigrationUri("otpauth-migration://offline")).toThrow();
  });
});
