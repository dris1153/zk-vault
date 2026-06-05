---
phase: 2
title: "Thread email + lock-screen field"
status: pending
priority: P2
effort: "2-3h"
dependencies: [1]
---

# Phase 2: Thread email + lock-screen field

## Overview
Pass the email from the lock screen through the create/unlock paths (setting the
identity), and add the prefilled email input to the lock screen.

## Requirements
- Functional: signup + cold unlock both take an email; identity is set before any
  derive/sign-in; existing-email reproduces the existing vault.
- Non-functional: email-format validation; clear error on failure; < 200 lines/file.

## Architecture
- `lib/supabase/provisioning.ts`:
  - `provisionVault(email, master, tuning?)` -> `setVaultEmail(email)`, then
    `createVault(master, email, tuning)` + signUp/signIn (as today).
  - `authenticate(email, master, tuning?)` -> `setVaultEmail(email)`, then
    `deriveAuthSecret(master, email, tuning)` + signIn + getVaultConfig.
- `lib/vault/actions.ts`: `createVaultAndUnlock(email, master)` / `unlock(email, master)`
  pass email down.
- `lib/vault/use-vault.ts`: expose `createVault(email, master)` / `unlock(email, master)`.
- `lib/vault/change-master.ts`: replace `VAULT_EMAIL` with `getVaultEmail()` (throws if
  missing) for both `deriveAuthSecret` calls.
- `components/lock-screen.tsx`:
  - Add an Email `TextInput` (type=email) ABOVE the master field in BOTH modes,
    `defaultValue`/state seeded from `getVaultEmail()`.
  - Validate: non-empty + contains "@" (basic). On submit pass `(email, pw)`.
  - Keep the biometric button (its path carries email in the bundle, no field needed)
    and the master fallback.

## Related Code Files
- Modify: `lib/supabase/provisioning.ts`, `lib/vault/actions.ts`,
  `lib/vault/use-vault.ts`, `lib/vault/change-master.ts`, `components/lock-screen.tsx`

## Implementation Steps
1. Add email params to provisioning + actions + use-vault, calling `setVaultEmail`.
2. change-master reads `getVaultEmail()`.
3. Lock screen email field (prefill + validate) + thread into submit.
4. Sanity: enter the existing email + master -> existing vault opens.

## Success Criteria
- [ ] Create + unlock require an email; identity is set before derive/sign-in.
- [ ] Existing email opens the existing vault (no migration).
- [ ] Wrong email -> clear error (failed sign-in / no config).

## Risk Assessment
- Order matters: `setVaultEmail` MUST run before any `requireEmail()`/sign-in call.
- Don't trim away a valid email's case; lowercase only if Supabase is case-sensitive
  (leave as typed; Supabase emails are case-insensitive).
