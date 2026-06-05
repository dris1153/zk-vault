---
phase: 2
title: "Supabase Backend"
status: code-complete (live verification pending user Supabase project)
priority: P1
effort: "1-2d"
dependencies: [1]
---

# Phase 2: Supabase Backend

## Overview
Postgres schema (ciphertext-only), RLS, single-user dual-derive auth, and first-run vault provisioning. Supabase is a dumb ciphertext store + auth gate; it never sees plaintext or keys.

## Requirements
- Functional: store vault_config + vault_items; authenticate via derived authSecret; enforce per-user RLS; provision a new vault on first run.
- Non-functional: RLS denies cross-user access; anon key exposure yields only ciphertext; migrations reproducible.

## Architecture
- **Auth (single-user, dual-derive):** Supabase Auth email+password. email = user's fixed email; password = `authSecret = deriveAuthSecret(masterPassword, salt_auth)` (base64). Raw master password never sent. authSecret salted independently from KEK_master.
- **Tables:**
  - `vault_config (user_id uuid PK→auth.users, kdf_params jsonb, wrapped_dek_master jsonb, wrapped_dek_recovery jsonb, created_at, updated_at)`.
  - `vault_items (id uuid PK, user_id uuid→auth.users, type text check in (login,wallet,ssh_key,secure_note,api_key), favorite bool default false, encrypted_data text, iv text, created_at, updated_at)`.
  - `type` + `favorite` plaintext (category counts/filter without decrypt). Everything else in `encrypted_data`.
- **RLS:** enable on both tables; policies `auth.uid() = user_id` for select/insert/update/delete. `salt_*` lives inside `kdf_params` (public-safe; salts aren't secret).
- **Provisioning:** first run → `createVault()` (Phase 1) → `supabase.auth.signUp(email, authSecret)` → insert `vault_config`. Show recovery words once (Phase 6 UI).

## Related Code Files
- Create: `supabase/migrations/0001_init.sql` (tables, RLS, indexes)
- Create: `lib/supabase/client.ts` (browser client from `@supabase/ssr` / `supabase-js`)
- Create: `lib/supabase/vault-config.ts` (get/insert/update config row)
- Create: `lib/supabase/types.ts` (generated DB types)
- Create: `.env.local.example` (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Modify: `package.json` (`@supabase/supabase-js`, `@supabase/ssr`)

## Implementation Steps
1. Create Supabase project; capture URL + anon key into `.env.local` (gitignored).
2. Write `0001_init.sql`: both tables, `alter table ... enable row level security`, four policies each, index `vault_items(user_id, type)`, `updated_at` trigger.
3. Apply migration (Supabase CLI `db push` or SQL editor).
4. `client.ts`: browser Supabase client (anon key, persists session).
5. `vault-config.ts`: `getConfig()`, `insertConfig(cfg)`, `updateWrappedMaster(...)` — all client-side calls.
6. Wire provisioning entry point `provisionVault(masterPassword)` (used by Phase 3 first-run): createVault → signUp → insertConfig → return DEK + recoveryWords.
7. Verify RLS: with a second test user, confirm zero rows visible across users.

## Success Criteria
- [ ] Migration applies cleanly; tables + RLS + policies present.
- [ ] signUp/signIn works with authSecret as password; session persists.
- [ ] RLS blocks cross-user reads (verified with 2 users).
- [ ] DB dump shows only ciphertext for sensitive fields (no readable secret).
- [ ] No service-role key in client bundle; only anon key (`NEXT_PUBLIC_*`).

## Risk Assessment
- Service-role key leak → never ship it client-side; client uses anon key only.
- RLS misconfig → explicit cross-user test before proceeding.
- authSecret == server-knowable → acceptable; salted separately from KEK, raw master never sent, DEK never derivable from authSecret.
- Email/identity for single user → use a real address you control (needed for Supabase Auth); document it.
