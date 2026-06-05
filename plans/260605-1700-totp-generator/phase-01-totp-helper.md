---
phase: 1
title: "TOTP Helper + Dependency"
status: pending
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: TOTP Helper + Dependency

## Overview
Add `otpauth` and a small `lib/ui/totp.ts` that parses a secret/URI into an
`OTPAuth.TOTP` and computes the current code + remaining seconds.

## Requirements
- Functional: accept a base32 secret OR an `otpauth://` URI; return null on
  invalid input; compute `{ code, secondsRemaining, period }` for "now".
- Non-functional: pure client, no network/WASM, < 200 lines, no crypto/vault import.

## Architecture
- `lib/ui/totp.ts`:
  - `parseTotp(input: string): OTPAuth.TOTP | null`
    - trim; if starts with `otpauth://` -> `OTPAuth.URI.parse(input)` (must be a
      TOTP instance; else null); otherwise `new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(cleaned) })`.
    - wrap in try/catch -> null on any error (invalid base32, bad URI).
    - normalize bare secret: strip spaces, uppercase before `fromBase32`.
  - `currentCode(totp: OTPAuth.TOTP, now = Date.now()): { code: string; secondsRemaining: number; period: number }`
    - `code = totp.generate({ timestamp: now })`; `period = totp.period`;
      `secondsRemaining = period - Math.floor(now / 1000) % period`.
  - `formatCode(code: string): string` -> group as `XXX XXX` (or halves for 8-digit).

## Related Code Files
- Create: `lib/ui/totp.ts`
- Modify: `package.json` (add `otpauth`)

## Implementation Steps
1. `npm install otpauth`.
2. Write `totp.ts` with `parseTotp`, `currentCode`, `formatCode`.
3. Quick sanity in a scratch (or unit-style) check: a known base32 secret yields
   a 6-digit code; an `otpauth://totp/...?secret=...&period=60&digits=8` keeps
   those params; garbage -> null.

## Success Criteria
- [ ] `parseTotp` handles bare base32 + otpauth URI + returns null on invalid.
- [ ] `currentCode` returns a code and correct `secondsRemaining`.
- [ ] No import of lib/crypto or lib/vault.

## Risk Assessment
- otpauth API shape (Secret.fromBase32, URI.parse) -> verify against installed
  version; guard with try/catch so bad input never throws into the UI.
