---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Verify

## Overview
Confirm correctness, zero-knowledge intact, a clean build, and a real biometric
round-trip on localhost.

## Implementation Steps
1. `npx tsc --noEmit` - clean (watch for WebAuthn PRF typing casts).
2. `npm run guard` - webauthn.ts / biometric-actions.ts are client modules; they
   must not be imported from a server context.
3. `grep` for em-dashes in new/changed files - none.
4. `npm run build` - passes. (A server on :3000 locking `.next` shows as a
   /_document or /404 prerender error - stop it and rebuild.)
5. Manual on `http://localhost:3000` (Chrome + Windows Hello, or Safari + Touch ID):
   - Unlock with master -> Settings -> enable biometric (enter master) -> succeeds.
   - Lock -> lock screen shows the biometric button -> unlock with biometric ->
     vault opens, items load, an item edited before still decrypts.
   - Disable -> button gone. Re-enable -> works.
   - Change master -> biometric cleared + note -> re-enable works.
   - DevTools: confirm IndexedDB `vault-biometric` holds only ciphertext (wrapped);
     no plaintext DEK/authSecret anywhere; no extra Supabase write on enable.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] Biometric round-trip works on a supporting browser; master fallback always.
- [ ] IndexedDB record is ciphertext-only; nothing extra sent to Supabase.
- [ ] Unsupported browser hides the feature cleanly.

## Risk Assessment
- If the local platform lacks PRF, the manual test can only confirm the feature is
  hidden + master still works; note that PRF round-trip needs a PRF-capable browser.
