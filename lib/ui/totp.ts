// TOTP helpers (otpauth). Pure client utilities - no network, no crypto/vault
// imports. Accepts a bare base32 secret OR a full otpauth:// URI.

import * as OTPAuth from "otpauth";

/** Parse a base32 secret or an otpauth:// URI into a TOTP. Null on invalid. */
export function parseTotp(input: string): OTPAuth.TOTP | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    if (/^otpauth:\/\//i.test(raw)) {
      const parsed = OTPAuth.URI.parse(raw);
      return parsed instanceof OTPAuth.TOTP ? parsed : null;
    }
    const cleaned = raw.replace(/\s+/g, "").toUpperCase();
    return new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(cleaned) });
  } catch {
    return null;
  }
}

export interface TotpMeta {
  issuer: string;
  account: string;
}

/** Extract issuer + account from an otpauth:// URI; null for bare secrets or invalid URIs. */
export function parseTotpMeta(input: string): TotpMeta | null {
  const raw = input.trim();
  if (!/^otpauth:\/\//i.test(raw)) return null;
  try {
    const parsed = OTPAuth.URI.parse(raw);
    if (!(parsed instanceof OTPAuth.TOTP)) return null;
    const rawIssuer = (parsed.issuer ?? "").trim();
    const rawLabel = (parsed.label ?? "").trim();
    const colonIdx = rawLabel.indexOf(":");
    if (colonIdx !== -1) {
      const prefix = rawLabel.slice(0, colonIdx).trim();
      const rest = rawLabel.slice(colonIdx + 1).trim();
      return {
        issuer: rawIssuer || prefix,
        account: rest,
      };
    }
    return {
      issuer: rawIssuer,
      account: rawLabel,
    };
  } catch {
    return null;
  }
}

export interface TotpState {
  code: string;
  secondsRemaining: number;
  period: number;
}

/** Current code + how many seconds remain in this period. */
export function currentCode(
  totp: OTPAuth.TOTP,
  now: number = Date.now(),
): TotpState {
  const period = totp.period;
  return {
    code: totp.generate({ timestamp: now }),
    period,
    secondsRemaining: period - (Math.floor(now / 1000) % period),
  };
}

/** Next period's code (shown in the last 5 seconds before rotation). */
export function nextCode(
  totp: OTPAuth.TOTP,
  now: number = Date.now(),
): string {
  return totp.generate({ timestamp: now + totp.period * 1000 });
}

/** Group a code for readability: "123456" -> "123 456". */
export function formatCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}
