---
phase: 2
title: "Biometric Actions + use-vault"
status: pending
priority: P2
effort: "2-3h"
dependencies: [1]
---

# Phase 2: Biometric Actions + use-vault

## Overview
Tie the WebAuthn core to the vault lifecycle: enable (wrap DEK+authSecret under
the PRF key), unlock with biometric, disable. Expose via the vault hook.

## Requirements
- Functional: enable (master prompt once), unlock-with-biometric, disable, has-biometric.
- Non-functional: reuse lib/crypto public API only; client-only; < 200 lines.

## Architecture
- `lib/vault/biometric-actions.ts`:
  - `enableBiometric(masterPassword: string): Promise<void>`
    - `const dek = useSession.getState().dek;` -> throw if locked.
    - `authSecret = await deriveAuthSecret(masterPassword, VAULT_EMAIL)` (lib/crypto + lib/supabase/client).
    - `dekRaw = base64(await crypto.subtle.exportKey("raw", dek))`.
    - `{ credentialId, prfSalt, prfOutput } = await enrollCredential()`.
    - `prfKey = await crypto.subtle.importKey("raw", prfOutput, {name:"AES-GCM"}, false, ["encrypt","decrypt"])`.
    - `wrapped = await encryptJSON({ dek: dekRaw, authSecret }, prfKey)`.
    - `await saveBiometric({ id:"default", credentialId: b64, prfSalt: b64, wrapped, rpId: location.hostname, createdAt })`.
  - `unlockWithBiometric(): Promise<void>`
    - `useSession.getState().setUnlocking()`.
    - `rec = await getBiometric()` -> throw if none.
    - `prfOutput = await getPrfOutput(base64ToBytes(rec.credentialId), base64ToBytes(rec.prfSalt))`.
    - `prfKey = importKey(...)`; `{ dek: dekRaw, authSecret } = await decryptJSON(rec.wrapped, prfKey)`.
    - `dek = await crypto.subtle.importKey("raw", base64ToBytes(dekRaw), {name:"AES-GCM"}, true, ["encrypt","decrypt"])`.
    - `await signInVault(authSecret)`; `useSession.getState().setUnlocked(dek)`; `await loadItems(dek)`.
    - on any error -> `useSession.getState().reset()` and rethrow (UI falls back to master).
  - `disableBiometric(): Promise<void>` -> `clearBiometric()`.
  - `hasBiometric(): Promise<boolean>` -> from webauthn.ts.
- `lib/vault/use-vault.ts`: add `biometric: { supported, enrolled, enable, unlock, disable }`.
  Because support/enrolled are async, expose them via small state the hook resolves on
  mount (e.g. a `useBiometricState()` returning `{ supported, enrolled, refresh }`), or
  fields the lock screen / settings query directly. Keep it simple and SSR-safe
  (all checks run in effects / on click, never during render on the server).

## Related Code Files
- Create: `lib/vault/biometric-actions.ts`
- Modify: `lib/vault/use-vault.ts`

## Implementation Steps
1. `enableBiometric` (derive authSecret + export DEK + enroll + wrap + save).
2. `unlockWithBiometric` (get PRF -> unwrap -> import DEK -> signIn -> load).
3. `disableBiometric`, `hasBiometric`.
4. Extend `use-vault` with biometric state + actions (async-safe).
5. Sanity: enable on localhost, lock, unlock-with-biometric returns the SAME DEK
   (an item encrypted before unlock still decrypts after).

## Success Criteria
- [ ] enable wraps and stores; disable clears.
- [ ] unlock-with-biometric yields the working DEK + a valid Supabase session.
- [ ] Wrong/cancelled biometric -> clean error, session reset, master still works.
- [ ] guard passes (no server-context import of these client modules).

## Risk Assessment
- Stale authSecret (master changed elsewhere) -> signIn fails after unwrap; surface
  "biometric out of date, unlock with master" and let master flow re-enable.
- DEK must be extractable to export raw (it is - createVault imports extractable).
- Never persist the unwrapped bundle or DEK anywhere except the existing RAM session.
