# Security Model

## Goal
Single-user, zero-knowledge credential vault: the server (Supabase) stores only
ciphertext and never has access to plaintext or any key material.

## Key hierarchy (envelope encryption)

```
Master Password
 ├─ Argon2id(salt = SHA-256(email), AUTH_KDF)  → authSecret  → Supabase Auth password
 └─ Argon2id(saltMaster [random, in DB])       → KEK_master  → unwraps the DEK

Recovery Key (24-word BIP39)
 └─ Argon2id(saltRecovery [random, in DB])     → KEK_recovery → unwraps the DEK

DEK (random 256-bit, RAM only when unlocked)
 ├─ AES-256-GCM(KEK_master)   → wrapped_dek_master    (stored)
 ├─ AES-256-GCM(KEK_recovery) → wrapped_dek_recovery  (stored)
 └─ AES-256-GCM(DEK, iv)      → each item's encrypted_data
```

- **Argon2id** params: 64 MiB, 3 iterations, p=1, 32-byte output (KEK). The auth
  derivation uses a fixed cost (`AUTH_KDF`) and an email-derived salt so login
  needs no prior DB read (avoids a read-config-before-auth circular dependency).
- **AES-256-GCM** with a fresh random 12-byte IV per encryption; the auth tag
  rejects any tampering or wrong key.
- **DEK** lives only in browser RAM while unlocked; wiped on lock/auto-lock.
  Raw key bytes are `fill(0)`-scrubbed after each wrap/unwrap (best-effort).

## Data stored in Supabase

- `vault_config` (1 row/user): `version`, `kdf_params` (costs + saltMaster +
  saltRecovery), `wrapped_dek_master`, `wrapped_dek_recovery`. All non-secret
  or ciphertext. **No saltAuth** (email-derived).
- `vault_items`: `type` + `favorite` (plaintext, for category counts/filters),
  `encrypted_data` + `iv` (ciphertext). Everything sensitive is inside the
  ciphertext.
- **RLS:** `auth.uid() = user_id` on every operation, both tables.

## Recovery (Option A)

`changeMaster` never touches the recovery wrap, so the 24-word recovery key is a
permanent escape hatch. To recover after a lost master password:

1. Create a new vault (new master) on any device.
2. Settings -> Backup -> Import your `.vault` file, unlocking it with the
   recovery key. Items are decrypted from the file and re-encrypted under the new
   vault's DEK.

Export bundles are ciphertext only (no DEK, no plaintext, no authSecret). Import
is atomic on decrypt (a wrong key/corrupt item aborts before any write) and
idempotent on write (rows upsert by id, so a retry never duplicates).

## Change-master safety

Auth-password rotation and the DB wrap write are not one transaction. On failure
the flow probes the real server auth state (sign-in test with old vs new secret)
and converges to a consistent pair, and never reports "reverted" unless the old
password is verified to still work. If indeterminate, it surfaces the recovery
key as the escape hatch rather than bricking silently.

## Threats in scope vs out of scope

In scope (mitigated): Supabase DB breach, network interception, Supabase
insider, anon-key exposure - all yield only ciphertext.

Out of scope (cannot be solved by this architecture):
- **Compromised device** (keylogger/malware) captures the master password at entry.
- **Web supply-chain**: a compromised host/dependency could serve malicious JS
  that exfiltrates the DEK at runtime. Mitigated by CSP, pinned/minimal deps, and
  self-hosting. A nonce-based CSP (removing `script-src 'unsafe-inline'`) and a
  PWA/extension are tracked for v2.
- **Lost master password AND lost recovery key/backup** = unrecoverable by design.
