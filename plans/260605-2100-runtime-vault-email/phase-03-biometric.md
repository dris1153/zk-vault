---
phase: 3
title: "Biometric bundle carries email"
status: pending
priority: P2
effort: "1h"
dependencies: [2]
---

# Phase 3: Biometric bundle carries email

## Overview
Make the biometric bundle self-contained by storing the email alongside the DEK
and authSecret, so biometric unlock does not depend on localStorage.

## Requirements
- Functional: enroll stores email; unlock sets identity from the bundle before sign-in.
- Non-functional: no plaintext leak (email lives in the same encrypted bundle).

## Architecture
- `lib/vault/biometric-actions.ts`:
  - `Bundle` type: `{ dek: string; authSecret: string; email: string }`.
  - `enableBiometric(master)`: `const email = getVaultEmail(); if (!email) throw ...`
    (it is set during the unlock that preceded enabling). Wrap
    `{ dek: dekRaw, authSecret, email }`.
  - `unlockWithBiometric()`: after `decryptJSON` -> `setVaultEmail(bundle.email)`
    BEFORE `signInVault(authSecret)` so `requireEmail()` resolves; then import DEK,
    sign in, setUnlocked, loadItems.

## Related Code Files
- Modify: `lib/vault/biometric-actions.ts`

## Implementation Steps
1. Add `email` to the bundle type + `enableBiometric` wrap.
2. `unlockWithBiometric` sets identity from the bundle before sign-in.
3. Sanity: enable biometric, clear localStorage `vault-email`, biometric unlock
   still works (email comes from the bundle).

## Success Criteria
- [ ] Biometric unlock works with an empty localStorage email (bundle supplies it).
- [ ] Bundle remains ciphertext-only; email never stored in plaintext.

## Risk Assessment
- Pre-existing biometric records lack `email` -> `bundle.email` is undefined ->
  sign-in would fail. Acceptable: the user re-enables biometric once. Optionally
  detect a missing email and clear the stale record with a re-enroll hint.
