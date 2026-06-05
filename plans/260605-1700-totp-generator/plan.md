---
title: "TOTP Generator (v1.5a)"
status: completed
priority: P2
created: 2026-06-05
feature: Live TOTP 2FA codes for Login items, from an encrypted secret
blockedBy: []
blocks: []
---

# TOTP Generator (v1.5a) - Plan

Generate live 6-digit TOTP codes for Login items. The secret lives in the
existing encrypted `totp_secret` field; codes are computed client-side. No
schema/RLS change, zero-knowledge intact.

## Locked decisions
1. **No schema change.** `totp_secret` already exists (encrypted). Store the raw
   user input - a base32 secret OR an `otpauth://` URI.
2. **Parse on display:** `otpauth://` -> `OTPAuth.URI.parse()` (keeps
   digits/period/algorithm); bare secret -> `new OTPAuth.TOTP({ secret })`
   defaults (6 digits, 30s, SHA1).
3. **Dependency:** `otpauth` (pure JS, no network/WASM -> no CSP change).
4. Display in the detail drawer only (not the card). No QR scan (v2).
5. Do NOT touch lib/crypto or the vault engine.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | TOTP helper + dependency | ✅ completed | [phase-01-totp-helper.md](./phase-01-totp-helper.md) |
| 2 | Form input (totp-field + wiring) | ✅ completed | [phase-02-form-input.md](./phase-02-form-input.md) |
| 3 | Drawer display (live code + ring + copy) | ✅ completed | [phase-03-drawer-display.md](./phase-03-drawer-display.md) |
| 4 | Verify (tsc / guard / build) | ✅ completed | [phase-04-verify.md](./phase-04-verify.md) |

## Dependencies
1 -> 2, 1 -> 3 (2 and 3 both use the helper); 4 last.

## Acceptance
- Paste a base32 secret OR `otpauth://` URI on a login; form shows a live
  preview; drawer shows a rotating 6-digit code + countdown + copy.
- Empty `totp_secret` -> no TOTP UI. Existing items unaffected.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.

## Next (separate cycle, NOT planned here)
**v1.5b - WebAuthn/biometric unlock**: PRF extension -> wrap `{ DEK, authSecret }`
in IndexedDB (per-device), master-password fallback always, feature-detect PRF.
Approach approved; will get its own brainstorm/plan.
