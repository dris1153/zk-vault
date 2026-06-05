---
title: "Zero-Knowledge Personal Credential Vault"
status: completed
priority: P1
created: 2026-06-05
stack: Next.js (App Router) · Supabase (Postgres+Auth+RLS) · Tailwind v4 · shadcn · Phosphor
design_system: ../../DESIGN.md (Electric Azure)
blockedBy: []
blocks: []
---

# Zero-Knowledge Personal Credential Vault — Plan

Single-user vault for logins, wallet keys, seed phrases, SSH keys, secure notes, API keys.
**Zero-knowledge E2E:** all encryption client-side; Supabase stores only ciphertext.

## Context
- Brainstorm/design: [brainstorm-summary.md](./brainstorm-summary.md)
- Approved UI look & flow: [mockup/vault-mockup.html](./mockup/vault-mockup.html)
- Design tokens: [../../DESIGN.md](../../DESIGN.md)

## Core Invariants (never violate)
1. All encrypt/decrypt happens in the browser. **No plaintext through Server Actions / API routes.**
2. DEK (Data Encryption Key) lives in browser RAM only while unlocked; wiped on lock.
3. Supabase rows = `{ type, favorite, encrypted_data, iv }` only. Everything sensitive is ciphertext.
4. No "forgot password". Recovery only via recovery key or encrypted export.

## Crypto model (envelope)
```
authSecret = Argon2id(master, salt = SHA256(email), fixed AUTH_KDF)  → Supabase Auth password
             ^ email-derived salt + fixed cost = login needs NO DB read (no chicken-and-egg)
KEK_master   = Argon2id(master,        salt_master  [random, in DB])  (RAM only)
KEK_recovery = Argon2id(recoveryPhrase, salt_recovery [random, in DB])
DEK = random 256-bit ─ AES-GCM(KEK_master)   → wrapped_dek_master
                     └ AES-GCM(KEK_recovery) → wrapped_dek_recovery   (24-word BIP39 recovery key)
Item: encrypted_data = AES-256-GCM(JSON, DEK, iv)
```
**Recovery model:** Option A - recovery key decrypts the encrypted `.vault` export
file (self-contained: salts + wrapped_dek_recovery + items). RLS stays strict;
no cloud read without login. (Decided during Phase 2; supersedes earlier draft.)

## Phases
| # | Phase | Status | Priority | File |
|---|-------|--------|----------|------|
| 1 | Crypto core (KDF, envelope, AES-GCM, recovery) + tests | ✅ completed | P1 | [phase-01-crypto-core.md](./phase-01-crypto-core.md) |
| 2 | Supabase schema, RLS, email-derive auth, provisioning | ✅ completed (live-verified) | P1 | [phase-02-supabase-backend.md](./phase-02-supabase-backend.md) |
| 3 | Lock/unlock flow, auto-lock, RAM DEK session | ✅ completed | P1 | [phase-03-lock-unlock-session.md](./phase-03-lock-unlock-session.md) |
| 4 | Vault CRUD (5 types) + encrypt/decrypt pipeline + search | ✅ completed | P1 | [phase-04-vault-crud-search.md](./phase-04-vault-crud-search.md) |
| 5 | UI (lock, shell, cards, drawer, modal, settings) | ✅ completed (build passes) | P2 | [phase-05-ui.md](./phase-05-ui.md) |
| 6 | Hardening (clipboard clear, export, recovery, CSP/SRI) | ✅ completed (reviewed) | P2 | [phase-06-hardening.md](./phase-06-hardening.md) |

**Status: v1 complete.** Engine live-verified against Supabase; full UI builds; all 6 phases reviewed. Remaining (deferred): v1.5 WebAuthn/TOTP, v2 nonce-CSP + password-health.

## Dependencies
1 → 2 → 3 → 4 → 5 → 6 (mostly sequential). 5 can start in parallel with 3–4 once crypto API (1) is stable.

## Out of scope (later)
- **v1.5:** WebAuthn/biometric unlock (PRF + fallback), TOTP generator (`otpauth`).
- **v2:** offline password-health check; PWA/extension to mitigate web supply-chain risk.

## Top risks (see per-phase Risk Assessment)
- Crypto correctness → heavy unit tests in Phase 1 before anything builds on it.
- Plaintext leak to server → client-only discipline + CI guard (Phase 6).
- Lost master = lost vault → recovery key + encrypted export (Phase 6).
- Web supply-chain (tampered served JS) → CSP + SRI + pinned minimal deps (Phase 6).
