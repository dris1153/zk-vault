# 2026-06-06 - Vault improvements (generator, backup reminder, rotate recovery)

Three YAGNI-vetted additions after a "what's actually missing" brainstorm. Brainstorm
-> plan -> cook -> code-review -> commit on `origin/dev`
(`af5250d`, `a682565`, `df436c3`, `2e11e83`).

## What
1. **Password generator + strength meter** - `lib/ui/password-gen.ts` (Web Crypto,
   rejection sampling, one char per enabled class + Fisher-Yates shuffle). A generate
   button + a live zxcvbn strength bar on password/passphrase fields only (not on
   imported seed/private keys). Reuses the existing lazy `loadZxcvbn` via a new
   exported `scorePassword`.
2. **Backup reminder** - stamp `lastExportAt` (settings/localStorage) on a successful
   export; the Backup tab shows the last-backup age and a stale warning (>30 days or
   never). Cheap insurance against the vault's biggest real risk: permanent data loss.
3. **Rotate recovery key** - `rotateRecovery(dek, cfg)` mirrors `changeMaster` on the
   recovery side: generate fresh 24 words, rotate ONLY saltRecovery, re-wrap the DEK,
   self-check the wrap (round-trip) before returning. Single vault_config write; the
   master wrap, auth secret, biometric bundle, and items are untouched. New words shown
   via the existing RecoveryWordsDialog.

## Code review caught (rotate recovery)
- **H1 (fixed):** the persist wrote the whole `kdf_params` (incl saltMaster), so a
  concurrent change-master between read and write could clobber a fresh saltMaster and
  brick master unlock. Fix: `updateRecoveryWrap` re-reads the live kdf_params and
  merges ONLY saltRecovery, never writing back a stale saltMaster.
- M2 (clear stale error on reopen) + L1 (use the constant-time `bytesEqual` for the
  self-check) fixed. M1 (a type-the-words-back step before discarding) left as accepted
  risk - consistent with the create-vault flow, which also gates on a confirm checkbox.
- Pre-existing: `changeMaster` has the same whole-blob write exposure; left out of
  scope (single-user, negligible) and flagged to the user.

## Verification
`tsc` clean, `guard` clean, `npm test` 17/17 (incl a new rotate-recovery test: new
words unlock the same DEK, old words fail, master still works, saltMaster preserved),
`build` passes. In-app docs (tinh-nang, khoi-phuc) updated; Vietnamese copy left for
the user to proofread.
