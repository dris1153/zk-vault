---
phase: 3
title: "Lock / Unlock / Session"
status: pending
priority: P1
effort: "1-2d"
dependencies: [1, 2]
---

# Phase 3: Lock / Unlock / Session

## Overview
Orchestrate unlock (derive → auth → fetch config → unwrap DEK), hold DEK in RAM only, and lock (wipe DEK) with auto-lock on idle/blur. The security boundary at runtime.

## Requirements
- Functional: first-run provisioning vs returning unlock; unlock by master password or recovery key; manual lock; auto-lock on timeout + tab hidden; re-auth refreshes Supabase session.
- Non-functional: DEK never written to localStorage/IndexedDB/cookies; cleared references on lock; KDF cost shown honestly (loading state).

## Architecture
- **Session store** (`lib/vault/session.ts`): module-scoped, non-persisted holder for `{ dek: CryptoKey|null, unlockedAt }`. Exposed via Zustand store WITHOUT persist middleware. `lock()` sets dek=null and clears decrypted-items store (Phase 4).
- **Unlock flow** (`lib/vault/unlock.ts`):
  1. `deriveAuthSecret(master, salt_auth)` → `supabase.auth.signInWithPassword`.
  2. `getConfig()` → kdf_params + wrapped keys.
  3. `deriveKEK(master, salt_master)` → `unlockWithMaster` → DEK. (Recovery path: `unlockWithRecovery(words, cfg)` then prompt to set new master via `changeMaster`.)
  4. Store DEK in session; mark unlocked.
- **Auto-lock** (`lib/vault/auto-lock.ts`): idle timer (configurable 1/5/15/30 min) reset on pointer/key activity; `visibilitychange` → lock on hidden (toggleable). On lock also `supabase.auth.signOut()` optional (keep session for re-fetch, but DEK gone).
- **Provider** (`app/providers/vault-provider.tsx`, `'use client'`): `useVault()` → `{ status: 'locked'|'unlocking'|'unlocked', unlock, unlockWithRecovery, lock, isFirstRun }`. Wraps app; gates routes.

## Related Code Files
- Create: `lib/vault/session.ts` (RAM DEK store, no persist)
- Create: `lib/vault/unlock.ts` (orchestration)
- Create: `lib/vault/auto-lock.ts` (idle + visibility)
- Create: `app/providers/vault-provider.tsx` (context, `useVault`)
- Modify: `app/layout.tsx` (mount provider)

## Implementation Steps
1. `session.ts`: Zustand store `{dek, status}` + `setDek/clear`. Guard: throw if anyone tries to serialize it.
2. `unlock.ts`: implement master + recovery flows using Phase 1/2 APIs; surface typed errors (WrongPassword, NoVault, NetworkError).
3. Detect first-run: `getConfig()` returns none → route to provisioning (Phase 2 `provisionVault`) → show recovery words (Phase 6).
4. `auto-lock.ts`: idle timer hook + visibility listener; read timeout from settings (Phase 6 default 5 min).
5. `vault-provider.tsx`: expose state machine; on lock, clear session + items store; on unlock, hydrate items (Phase 4).
6. Wire loading state for KDF (~0.7s) into unlock ("Decrypting…").

## Success Criteria
- [ ] Master-password unlock succeeds; wrong password rejected with clear error.
- [ ] Recovery-key unlock yields same DEK; offers set-new-master.
- [ ] DEK absent from all persistent storage (verify devtools Application tab).
- [ ] Auto-lock fires on idle timeout and on tab-hidden (when enabled); DEK wiped.
- [ ] Re-unlock after lock works without page reload.

## Risk Assessment
- DEK leak via persistence/devtools → no persist middleware; never put DEK in state that serializes; test storage is empty.
- Session vs DEK desync → DEK is the single source of "unlocked"; Supabase session alone never unlocks vault.
- Auto-lock annoyance vs safety → configurable, sane 5-min default, activity reset.
