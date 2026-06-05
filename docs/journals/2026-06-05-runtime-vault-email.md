# 2026-06-05 - Runtime vault email (drop NEXT_PUBLIC_VAULT_EMAIL)

Moved the vault email from a build-time env var to runtime user input. The user
now enters their email on the lock screen at first signup/unlock; it is remembered
in localStorage and prefilled afterwards. Brainstorm -> plan -> cook -> review ->
commit on `origin/dev` (`af12ee0`).

## Why
- Ergonomic/deployment: deploy once, use any email, no rebuild to change it; the
  email is no longer baked into the public JS bundle.
- Honest framing (recorded in the plan): this does NOT fix "leaked master = full
  compromise". The email is not a secret; it is the Supabase login id + the
  auth-secret salt (authSecret = Argon2id(master, salt=SHA-256(email))). Only the
  SOURCE of the email changed.

## What
- `lib/vault/identity.ts` (new): localStorage `vault-email` get/set/clear,
  canonicalized to lowercase.
- `auth.ts` `requireEmail()` reads it; `client.ts` dropped the `VAULT_EMAIL` export.
- Threaded `(email, master)` through provisioning/actions/use-vault; change-master
  and the webauthn label read the runtime email.
- Biometric bundle is now `{ dek, authSecret, email }` so biometric unlock is
  self-contained (sets identity from the bundle before sign-in); old records lacking
  email throw a clear "re-enable" and fall back to master.
- Lock screen gained an Email field (prefilled via effect, validated, threaded).
- Cleanup: removed the env var from `.env.local.example`, docs deployment section,
  both READMEs; `verify-supabase.ts` takes the email from a CLI arg / VAULT_VERIFY_EMAIL.

## Migration
No data migration: an existing vault reopens when the SAME email is entered (the
config's KEK salt is a separate random value; only authSecret/login depend on the
email). A wrong/typo email fails sign-in with a clear error, never a silent empty
vault.

## Review caught one real bug (fixed)
The login email was not lowercased while the auth salt is (kdf normalizes
trim+lowercase), so a case-variant email could lock the user out and coupled
correctness to GoTrue's internal normalization. Fixed by lowercasing in
`setVaultEmail` (login id + salt now provably the same string). Also strengthened
the email typo guard (a typo now means lockout, not a server-side miss).

## Verification
`tsc` clean, `guard` clean, `build` passes, and grep confirms no `VAULT_EMAIL` /
`NEXT_PUBLIC_VAULT_EMAIL` references remain in app code. The "same email reopens the
existing vault" check is a manual regression step (needs the real email + master).
