---
phase: 1
title: "Identity store + requireEmail"
status: pending
priority: P2
effort: "1h"
dependencies: []
---

# Phase 1: Identity store + requireEmail

## Overview
A localStorage-backed runtime source for the vault email, and switch `auth.ts` to
read it instead of the env constant.

## Requirements
- Functional: get/set/clear the vault email at runtime; auth uses it.
- Non-functional: client-only (SSR-safe); clear error when missing.

## Architecture
- `lib/vault/identity.ts` (new):
  - `getVaultEmail(): string | null` -> `typeof window === "undefined" ? null : localStorage.getItem("vault-email")`.
  - `setVaultEmail(email: string): void` -> `localStorage.setItem("vault-email", email.trim())`.
  - `clearVaultEmail(): void` -> `localStorage.removeItem("vault-email")`.
- `lib/supabase/auth.ts`:
  - `requireEmail()` -> `const e = getVaultEmail(); if (!e) throw new Error("Chưa có email vault. Nhập email để mở khóa."); return e;`
  - Remove the `VAULT_EMAIL` import from `./client`.
- `lib/supabase/client.ts`:
  - Remove `export const VAULT_EMAIL = ...` and its env read. Keep URL/ANON_KEY.

## Related Code Files
- Create: `lib/vault/identity.ts`
- Modify: `lib/supabase/auth.ts`, `lib/supabase/client.ts`

## Implementation Steps
1. Write `identity.ts`.
2. Point `requireEmail()` at `getVaultEmail()`.
3. Delete the `VAULT_EMAIL` export; fix any import (callers updated in Phase 2/3).

## Success Criteria
- [ ] `requireEmail()` resolves from localStorage; throws a clear message when unset.
- [ ] `client.ts` no longer references the email env var.

## Risk Assessment
- Callers of `VAULT_EMAIL` will break until Phase 2/3 update them -> expect tsc
  errors mid-refactor; resolve by the end of Phase 3.
