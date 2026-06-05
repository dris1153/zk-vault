---
title: "Runtime Vault Email (remove NEXT_PUBLIC_VAULT_EMAIL)"
status: completed
priority: P2
created: 2026-06-05
feature: User enters vault email at first login/signup (localStorage prefill); drop the build-time env var
blockedBy: []
blocks: []
---

# Runtime Vault Email - Plan

Stop requiring `NEXT_PUBLIC_VAULT_EMAIL`. The user enters the vault email on the
lock screen at first signup/unlock; it is remembered in localStorage and
prefilled after. The email-as-salt design is UNCHANGED - only the SOURCE of the
email moves from build-time env to runtime input + localStorage.

## Locked decisions
1. Email is needed BEFORE any DB read (auth salt + login id) -> user provides it on
   every cold unlock; localStorage prefill avoids retyping.
2. `lib/vault/identity.ts` (new): localStorage `vault-email` get/set/clear (client-only).
3. `requireEmail()` reads `getVaultEmail()`; `client.ts` drops the `VAULT_EMAIL` export.
4. Thread email through provisioning/actions/use-vault; lock screen gains an Email field.
5. Biometric bundle becomes `{ dek, authSecret, email }` (self-contained; re-enroll once).
6. Crypto internals untouched (`deriveAuthSecret`/`createVault` already take an email arg).

## Honest framing
This is an ERGONOMIC/deployment change, NOT a security upgrade. Email is not a
secret. It does NOT fix "leaked master = full compromise". It only removes the env
coupling and stops baking the email into the public JS bundle (minor obscurity).

## Migration
An existing vault is tied to the old env email. First unlock after this change:
enter the SAME email -> salt=SHA-256(email) reproduces -> existing vault opens, NO
data migration. A different/typo email = a different (empty) account or failed
sign-in -> surface a clear error.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | identity.ts + auth.requireEmail + drop client VAULT_EMAIL | ✅ completed | [phase-01-identity.md](./phase-01-identity.md) |
| 2 | Thread email (provisioning/actions/use-vault/change-master) + lock-screen field | ✅ completed | [phase-02-email-flow.md](./phase-02-email-flow.md) |
| 3 | Biometric bundle {dek,authSecret,email} | ✅ completed | [phase-03-biometric.md](./phase-03-biometric.md) |
| 4 | Cleanup env/docs/verify-script | ✅ completed | [phase-04-cleanup.md](./phase-04-cleanup.md) |
| 5 | Verify (tsc/guard/build + grep + manual) | ✅ completed | [phase-05-verify.md](./phase-05-verify.md) |

## Dependencies
1 -> 2 -> 3; 4 after 1-3; 5 last.

## Acceptance
- No `VAULT_EMAIL` / `NEXT_PUBLIC_VAULT_EMAIL` left in app code (only new identity).
- Lock screen: email field (prefilled) in create + unlock; entering the existing
  email opens the existing vault.
- Biometric unlock works from the bundle's email (no localStorage dependency).
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.

## Risks (brutal honesty)
- Wrong/typo email on unlock -> different account / failed sign-in -> prefill + clear error.
- Does NOT improve the master-is-everything model.
- Biometric re-enroll once (old bundle lacks email).
