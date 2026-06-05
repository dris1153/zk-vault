---
phase: 5
title: "Verify"
status: pending
priority: P2
effort: "0.5-1h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Verify

## Implementation Steps
1. `npx tsc --noEmit` - clean (all `VAULT_EMAIL` callers updated).
2. `npm run guard` - crypto/vault layer still client-only.
3. `grep -rn "NEXT_PUBLIC_VAULT_EMAIL\|VAULT_EMAIL" lib components scripts app` ->
   no app references (only `getVaultEmail` identity + the verify script's own var).
4. `grep` for em-dashes in new/changed files - none.
5. `npm run build` - passes. (If it fails on /_document or /404, a server on :3000
   is locking `.next` - stop it and rebuild.)
6. Manual (`npm run dev`):
   - Fresh session (clear localStorage): lock screen shows an Email field; enter the
     SAME email used before + master -> the EXISTING vault opens (no data loss).
   - Reload -> email is prefilled; only master needed.
   - Enable biometric, clear localStorage `vault-email`, biometric unlock still works.
   - Change master still works (reads the runtime email).
   - Wrong email + master -> clear error, not a silent empty vault.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] No app references to the removed env var.
- [ ] Existing vault opens with the same email; biometric self-contained.

## Risk Assessment
- The "same email opens existing vault" check is the critical regression guard -
  verify it before shipping (a wrong salt would silently look like an empty vault).
