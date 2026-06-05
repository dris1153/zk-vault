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

/** Group a code for readability: "123456" -> "123 456". */
export function formatCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  const mid = Math.ceil(code.length / 2);
  return `${code.slice(0, mid)} ${code.slice(mid)}`;
}
