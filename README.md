# Vault - Personal Zero-Knowledge Credential Vault

A single-user, end-to-end encrypted store for logins, wallet keys, seed phrases,
SSH keys, secure notes, and API keys. All encryption happens in your browser;
Supabase only ever stores ciphertext.

Built with Next.js (App Router) + Supabase (Postgres + Auth + RLS) + Tailwind v4.

## Security model (read this)

- **Zero-knowledge.** Your master password never leaves the browser. Encryption
  and decryption happen client-side only - no plaintext passes through any
  server route or action (enforced by `npm run guard`).
- **Envelope encryption.** A random 256-bit Data Encryption Key (DEK) encrypts
  every item (AES-256-GCM). The DEK is wrapped by a key derived from your master
  password (Argon2id) and, separately, by a key from your 24-word recovery key.
- **Email-derived auth salt.** Your Supabase login secret is
  `Argon2id(master, salt = SHA-256(email))` with a fixed cost, so you can log in
  from any device with just master + email - no server read needed first.
- **Strict RLS.** Every row is scoped to `auth.uid()`. Even with the public anon
  key, rows are unreadable without your login and contain only ciphertext.
- **No "forgot password".** If you lose your master password, recover with your
  24-word recovery key + your encrypted `.vault` backup (Settings -> Backup).
  Lose both and the data is unrecoverable - that is the cost of zero-knowledge.
- **Residual risks (honest):** a web app re-downloads its crypto code on each
  load, so a compromised host/dependency could serve malicious JS. Mitigated by
  CSP, pinned deps, and self-hosting; not fully solvable for web vaults. A
  compromised device (keylogger/malware) is also out of scope. See
  `docs/security-model.md`.

## Setup

1. **Supabase:** create a project, copy the URL + anon key.
2. **Env:** `cp .env.local.example .env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAULT_EMAIL`. For `npm run db:reset`
   also set `SUPABASE_DB_URL` (session-pooler connection string). See
   `supabase/README.md`.
3. **Auth:** in Supabase, turn OFF "Confirm email".
4. **Schema:** apply `supabase/migrations/0001_init.sql` (SQL Editor, or
   `npm run db:reset`).
5. **Verify:** `npm run verify:supabase` (live end-to-end smoke test).
6. **Run:** `npm run dev` -> http://localhost:3000 -> create your vault.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm test` | Crypto unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run guard` | Fail if any server-context file imports the crypto/vault layer |
| `npm run verify:supabase` | Live engine smoke test (throwaway account) |
| `npm run db:reset` | Drop + re-apply migrations (DEV ONLY - wipes vault data) |

`npm run build` runs the guard first.

## Architecture

```
lib/crypto/     pure, framework-agnostic crypto (KDF, AES-GCM, envelope, recovery)
lib/supabase/   browser client, auth, vault_config, provisioning (ciphertext I/O)
lib/vault/      session (RAM DEK), unlock/lock, CRUD, search, export/import, settings
lib/ui/         icon map, clipboard hook, field config
components/     lock screen, app shell, sidebar, cards, drawer, modals, settings
app/            App Router shell + page orchestrator
supabase/       migration + setup guide
scripts/        verify, db-reset, zero-knowledge guard
```

Design system: `DESIGN.md` (Electric Azure on Obsidian, dark-only).
Implementation plan + history: `plans/260605-1204-zk-credential-vault/`.

## Status

v1 complete: crypto, backend, session, CRUD, UI, hardening (export/import,
change-master, CSP, CI guard). Deferred: **v1.5** WebAuthn/biometric unlock +
TOTP generator; **v2** nonce-based CSP, offline password-health check, PWA.
