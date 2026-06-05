---
phase: 1
title: "WebAuthn Core (ceremony + PRF + IndexedDB)"
status: pending
priority: P2
effort: "3-4h"
dependencies: []
---

# Phase 1: WebAuthn Core

## Overview
The low-level WebAuthn layer: feature detection, credential enrollment, PRF
output retrieval, and a tiny promisified IndexedDB store for the wrapped bundle.

## Requirements
- Functional: detect support; enroll a platform credential and obtain a 32-byte
  PRF output; re-obtain PRF output for a saved credential; persist/read/clear one
  biometric record in IndexedDB.
- Non-functional: raw WebAuthn (no dep), client-only, secure-context aware, < 200 lines.

## Architecture
- `lib/vault/webauthn.ts`:
  - `isBiometricSupported(): Promise<boolean>` - `window.PublicKeyCredential` exists
    AND `isUserVerifyingPlatformAuthenticatorAvailable()` resolves true. (PRF itself
    is verified at enroll via `prf.enabled`.)
  - `enrollCredential(): Promise<{ credentialId: ArrayBuffer; prfSalt: Uint8Array; prfOutput: ArrayBuffer }>`
    - `navigator.credentials.create({ publicKey: { rp:{id: location.hostname, name:"Vault"},
      user:{ id: randomBytes(16), name: VAULT_EMAIL, displayName:"Vault" },
      challenge: randomBytes(32), pubKeyCredParams:[{alg:-7,type:"public-key"},{alg:-257,type:"public-key"}],
      authenticatorSelection:{ authenticatorAttachment:"platform", userVerification:"required", residentKey:"preferred" },
      attestation:"none", extensions:{ prf:{} } } })`.
    - If `cred.getClientExtensionResults().prf?.enabled !== true` -> throw `BiometricUnsupportedError`.
    - `prfSalt = randomBytes(32)`; then `getPrfOutput(cred.rawId, prfSalt)` to fetch the PRF output.
  - `getPrfOutput(credentialId: BufferSource, prfSalt: Uint8Array): Promise<ArrayBuffer>`
    - `navigator.credentials.get({ publicKey:{ challenge: randomBytes(32), rpId: location.hostname,
      allowCredentials:[{ id: credentialId, type:"public-key" }], userVerification:"required",
      extensions:{ prf:{ eval:{ first: prfSalt } } } } })`.
    - return `assertion.getClientExtensionResults().prf!.results!.first` (ArrayBuffer); throw if absent.
  - IndexedDB (`vault-biometric` db, store `cred`): promisified `openDB`, then
    `saveBiometric(rec)`, `getBiometric(): Promise<BiometricRecord|null>`,
    `clearBiometric()`, `hasBiometric(): Promise<boolean>`.
    - `interface BiometricRecord { id:"default"; credentialId: string; prfSalt: string; wrapped: {iv;ct}; rpId: string; createdAt: string }` (binary as base64).
- Types from WebAuthn PRF may need light `as` casts (the DOM lib may not type `prf` yet);
  isolate casts in this file.

## Related Code Files
- Create: `lib/vault/webauthn.ts`

## Implementation Steps
1. Promisified IndexedDB open + the 4 store functions.
2. `isBiometricSupported`.
3. `getPrfOutput` (used by enroll + unlock).
4. `enrollCredential` (create + prf.enabled check + getPrfOutput).
5. Sanity on localhost (Chrome + Windows Hello): enroll returns a 32-byte PRF output;
   `getPrfOutput` with the same salt returns the SAME bytes.

## Success Criteria
- [ ] `isBiometricSupported` true on a platform-authenticator browser, false otherwise.
- [ ] enroll returns a stable 32-byte PRF output; re-get with same salt = same bytes.
- [ ] IndexedDB save/get/clear/has round-trip works.
- [ ] No crypto/vault-internal imports; raw WebAuthn only.

## Risk Assessment
- PRF typing gaps in TS DOM lib -> localized casts; runtime-guard `prf.results.first`.
- PRF output stability: same (credential, salt) MUST yield the same secret across
  calls/sessions or unlock breaks -> verified in the sanity step.
- create() vs get() for PRF: always do create then a separate get (most compatible).
