---
title: "Zero-Knowledge Personal Credential Vault"
status: pending
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
Master Password ─ Argon2id(salt_auth)   → authSecret → Supabase Auth password (RLS gate)
                └ Argon2id(salt_master) → KEK_master (RAM only)
DEK = random 256-bit ─ AES-GCM(KEK_master)   → wrapped_dek_master
                     └ AES-GCM(KEK_recovery) → wrapped_dek_recovery   (KEK_recovery from 24-word recovery key)
Item: encrypted_data = AES-256-GCM(JSON, DEK, iv)
```

## Phases
| # | Phase | Status | Priority | File |
|---|-------|--------|----------|------|
| 1 | Crypto core (KDF, envelope, AES-GCM, recovery) + tests | pending | P1 | [phase-01-crypto-core.md](./phase-01-crypto-core.md) |
| 2 | Supabase schema, RLS, dual-derive auth, provisioning | pending | P1 | [phase-02-supabase-backend.md](./phase-02-supabase-backend.md) |
| 3 | Lock/unlock flow, auto-lock, RAM DEK session | pending | P1 | [phase-03-lock-unlock-session.md](./phase-03-lock-unlock-session.md) |
| 4 | Vault CRUD (5 types) + encrypt/decrypt pipeline + search | pending | P1 | [phase-04-vault-crud-search.md](./phase-04-vault-crud-search.md) |
| 5 | UI (lock, shell, cards, drawer, modal, settings) | pending | P2 | [phase-05-ui.md](./phase-05-ui.md) |
| 6 | Hardening (clipboard clear, export, recovery, CSP/SRI) | pending | P2 | [phase-06-hardening.md](./phase-06-hardening.md) |

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
