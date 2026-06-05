---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "0.5h"
dependencies: [1, 2, 3]
---

# Phase 4: Verify

## Overview
Confirm correctness, zero-knowledge intact, and a clean build.

## Implementation Steps
1. `npx tsc --noEmit` - clean.
2. `npm run guard` - totp.ts / totp-field / totp-display must not import
   lib/crypto or lib/vault from a server context (they are client UI).
3. `grep` for em-dashes (`—`, `–`) in the new/changed files - none.
4. `npm run build` - passes. (If it fails on a /_document or /404 prerender
   error, a server on :3000 is locking `.next` - stop it and rebuild.)
5. Manual smoke: add a login with a base32 secret -> drawer code rotates + copy
   works; add one with an `otpauth://...&period=60&digits=8` URI -> respects
   those params; invalid secret -> invalid hint; no secret -> no TOTP UI.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] Zero-knowledge intact (secret stays in encrypted_data; codes client-side).
- [ ] No external request added (otpauth is offline); no CSP change.

## Risk Assessment
- Bundle size of otpauth -> small; confirm it tree-shakes / does not bloat the
  vault page meaningfully in the build output.
