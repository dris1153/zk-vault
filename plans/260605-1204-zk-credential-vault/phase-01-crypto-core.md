---
phase: 1
title: "Crypto Core"
status: completed
priority: P1
effort: "2-3d"
dependencies: []
---

# Phase 1: Crypto Core

## Overview
Pure, framework-agnostic crypto module: Argon2id KDF, AES-256-GCM, DEK envelope (wrap/unwrap), 24-word recovery key. Heavily unit-tested BEFORE any feature builds on it — a bug here silently corrupts or exposes every secret.

## Requirements
- Functional: derive keys from master password (dual salts), generate + wrap/unwrap DEK, encrypt/decrypt JSON items, generate/restore recovery key, change master password (re-wrap only).
- Non-functional: runs in browser (WASM + Web Crypto), constant-time where the primitive allows, no secret logging, deterministic test vectors.

## Architecture
- KDF: `hash-wasm` Argon2id. Params: memory 64 MiB (65536), iterations 3, parallelism 1, hashLen 32. **Domain separation via distinct salts**: `salt_auth`, `salt_master`, `salt_recovery` (16 random bytes each). authSecret derivation must be independent of KEK so the server-known authSecret cannot derive KEK.
- AES-256-GCM via native `crypto.subtle`. Random 12-byte IV per encryption. Auth tag verifies integrity (tamper → throw).
- Envelope: `DEK = crypto.getRandomValues(32)`. `wrapped = AES-GCM(DEK, KEK)`. Unwrap reverses. Vault creation wraps DEK under both KEK_master and KEK_recovery.
- Recovery key: 256-bit entropy → 24 words (BIP39 wordlist via `@scure/bip39`). Words → entropy → Argon2id(salt_recovery) → KEK_recovery.

## Related Code Files
- Create: `lib/crypto/kdf.ts` (deriveAuthSecret, deriveKEK)
- Create: `lib/crypto/aes.ts` (encryptJSON, decryptJSON, low-level wrap/unwrap)
- Create: `lib/crypto/envelope.ts` (createVault, unlockWithMaster, unlockWithRecovery, changeMaster)
- Create: `lib/crypto/recovery-key.ts` (generate, encode/decode words ↔ bytes)
- Create: `lib/crypto/types.ts` (KdfParams, WrappedKey, EncryptedBlob, VaultConfigCrypto)
- Create: `lib/crypto/index.ts` (public API surface)
- Create: `lib/crypto/__tests__/*.test.ts` (Vitest)
- Modify: `package.json` (deps), project bootstrap (Next.js + Vitest)

## Implementation Steps
1. Bootstrap project: `create-next-app` (App Router, TS, Tailwind v4), add Vitest + `@vitest/web`/jsdom, install `hash-wasm`, `@scure/bip39`.
2. `types.ts`: define `KdfParams {algo, memKiB, iterations, parallelism, saltAuth, saltMaster, saltRecovery}`, `EncryptedBlob {iv, ct}`, `WrappedKey = EncryptedBlob`.
3. `kdf.ts`: `deriveBytes(password, salt, params)` wrapping hash-wasm argon2id; `deriveAuthSecret()` (base64 for Supabase pw), `deriveKEK()` → CryptoKey via `importKey`.
4. `aes.ts`: `encryptJSON(obj, key)` → `{iv, ct}` (base64); `decryptJSON(blob, key)`; raw `wrapKey/unwrapKey` for DEK bytes.
5. `recovery-key.ts`: `generateRecoveryKey()` → {words[24], entropy}; `wordsToEntropy()`.
6. `envelope.ts`:
   - `createVault(masterPassword)` → generates salts + DEK + recoveryKey, returns `{kdfParams, wrappedDekMaster, wrappedDekRecovery, recoveryWords}` + DEK.
   - `unlockWithMaster(masterPassword, cfg)` → KEK_master → unwrap → DEK (throws on wrong pw via GCM tag).
   - `unlockWithRecovery(words, cfg)` → DEK.
   - `changeMaster(dek, newPassword, cfg)` → new salt_master + wrappedDekMaster (DEK & items untouched).
7. Tests: round-trip encrypt/decrypt all primitive shapes; wrong password throws; tampered ct/iv throws (GCM); unwrap via master AND recovery yield identical DEK; changeMaster preserves DEK; recovery words ↔ entropy stable; known-answer vectors pinned.

## Success Criteria
- [ ] All crypto unit tests pass (round-trip, tamper-reject, dual-unwrap-equal, change-master, recovery).
- [ ] No `console.log` of secrets; no secret persisted anywhere.
- [ ] Module imports only browser-safe primitives (WASM + Web Crypto), zero Node-only APIs.
- [ ] Public API in `index.ts` is the only surface other phases import.

## Risk Assessment
- **Catastrophic correctness risk** → mitigated by test-first, pinned known-answer vectors, dual-unwrap equality assertion.
- IV reuse → always `getRandomValues` per op; test asserts uniqueness.
- Weak KDF params → 64 MiB/3 iters baseline; document tuning + make params stored per-vault (future-proof).
- hash-wasm bundle size / load → lazy-load WASM; acceptable for an unlock-time op.
