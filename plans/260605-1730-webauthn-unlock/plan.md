---
title: "WebAuthn / Biometric Unlock (v1.5b)"
status: completed
priority: P2
created: 2026-06-05
feature: Optional per-device biometric unlock via WebAuthn PRF; master is the root + fallback
blockedBy: []
blocks: []
---

# WebAuthn / Biometric Unlock (v1.5b) - Plan

Optional Face/Touch/Windows Hello unlock per device, using the WebAuthn **PRF
extension**. The master password stays the root of trust and the always-available
fallback. Zero-knowledge intact: nothing extra reaches Supabase; the wrapped
bundle lives only in local IndexedDB, decryptable only via the device authenticator.

## Locked decisions
1. **Raw WebAuthn API, no new dependency** (local-only, no server attestation).
2. **Enroll prompts master once** - `enableBiometric(master)` re-derives authSecret
   and wraps `{ DEK, authSecret }`; session.ts is NOT changed.
3. **Change-master clears local biometric** (it rotates authSecret -> stored
   bundle goes stale) + a "re-enable" note.
4. **Feature-detect PRF** - hide the option where unsupported. Master fallback always.

## Crypto of the wrap
- PRF output (32 bytes) -> `crypto.subtle.importKey("raw", prfOutput, {name:"AES-GCM"}, false, ["encrypt","decrypt"])`.
- Bundle = `encryptJSON({ dek: base64(exportKey raw), authSecret }, prfKey)` (lib/crypto public API).
- Unlock: `decryptJSON` -> import DEK via `importKey("raw", ..., true, ["encrypt","decrypt"])`,
  then `signInVault(authSecret)`.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | webauthn.ts (ceremony + PRF + IndexedDB + detect) | ✅ completed | [phase-01-webauthn-core.md](./phase-01-webauthn-core.md) |
| 2 | biometric-actions + use-vault | ✅ completed | [phase-02-biometric-actions.md](./phase-02-biometric-actions.md) |
| 3 | UI wiring (lock screen + settings + change-master) | ✅ completed | [phase-03-ui-wiring.md](./phase-03-ui-wiring.md) |
| 4 | Verify (tsc / guard / build + localhost test) | ✅ completed | [phase-04-verify.md](./phase-04-verify.md) |

## Dependencies
1 -> 2 -> 3 (sequential); 4 last.

## Acceptance
- Where PRF is supported: enable biometric (master prompt once), reload, unlock
  with Face/Touch; master fallback always present. Disable removes it.
- Unsupported browser: the option is hidden; nothing breaks.
- Change master -> biometric is cleared with a re-enable note.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.

## Risks (brutal honesty)
- **PRF support uneven** (Chrome 116+/Edge, Safari 18+, Firefox limited) -> feature-detect + hide; biometric is convenience, not a requirement.
- **Per-origin + per-device** binding: a credential enrolled on localhost does NOT work on the Vercel domain; each device enrolls its own.
- **Device theft + biometric bypass = vault access on that device** - same threat model as any biometric vault. Master remains the root.
- Needs a **secure context** (localhost dev / HTTPS prod).

## Prereq for v1.5b
v1.5a (TOTP) is shipped. This is the second half of v1.5.
