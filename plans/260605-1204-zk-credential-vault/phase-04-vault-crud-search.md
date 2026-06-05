---
phase: 4
title: "Vault CRUD + Search"
status: pending
priority: P1
effort: "2d"
dependencies: [1, 2, 3]
---

# Phase 4: Vault CRUD + Search

## Overview
Encrypt/decrypt pipeline over the 5 item types, full CRUD against Supabase (ciphertext in/out), and instant in-memory fuzzy search after decrypt-on-unlock.

## Requirements
- Functional: list (fetch ciphertext → decrypt with DEK → in-memory array), create, update, delete; per-type validated schemas; fuzzy search; category/tag/favorite filtering.
- Non-functional: decrypt happens once per unlock then cached in RAM; no plaintext leaves the client; items store cleared on lock.

## Architecture
- **Schemas** (`lib/vault/schemas.ts`, zod):
  - `login {title, username, password, url?, totp_secret?, notes?, tags[]}`
  - `wallet {title, network, address, private_key, seed_phrase?, derivation_path?, notes?, tags[]}`
  - `ssh_key {title, host?, username?, private_key, public_key?, passphrase?, notes?, tags[]}`
  - `secure_note {title, content, tags[]}`
  - `api_key {title, service, key, secret?, notes?, tags[]}`
  - Plaintext columns: `type`, `favorite`. Encrypted payload = the rest as JSON.
- **CRUD** (`lib/vault/items.ts`):
  - `listItems()` → select rows → `decryptJSON(encrypted_data/iv, dek)` → merge with `{id,type,favorite,updatedAt}` → store in memory.
  - `createItem(type, data, favorite)` → `encryptJSON(data, dek)` → insert `{type, favorite, encrypted_data, iv}`.
  - `updateItem(id, data, favorite)` → re-encrypt → update.
  - `deleteItem(id)` → delete row.
- **Items store** (`lib/vault/items-store.ts`, Zustand, non-persist): decrypted items in RAM; cleared by `lock()`.
- **Search** (`lib/vault/search.ts`): `fuse.js` index over `{title, username, url, service, host, tags, notes}`; rebuild on items change; `search(query)` returns ranked ids. Category/favorite filtering uses plaintext `type`/`favorite` without decrypt.

## Related Code Files
- Create: `lib/vault/schemas.ts` (zod per type + discriminated union)
- Create: `lib/vault/items.ts` (encrypt/decrypt CRUD)
- Create: `lib/vault/items-store.ts` (RAM store)
- Create: `lib/vault/search.ts` (fuse.js index)
- Modify: `app/providers/vault-provider.tsx` (hydrate items on unlock, clear on lock)
- Modify: `package.json` (`zod`, `fuse.js`)

## Implementation Steps
1. Define zod schemas + `VaultItem` discriminated union; export `parseByType(type, data)`.
2. `items.ts`: implement list/create/update/delete using Phase 1 AES + Phase 2 client; all client-side.
3. `items-store.ts`: hold decrypted items; selectors by category/tag/favorite; clear on lock.
4. `search.ts`: build Fuse index from store; expose `useSearch(query)` returning filtered/ranked items.
5. Hydrate on unlock (provider): `listItems()` → populate store → build index.
6. Tests: encrypt→insert→fetch→decrypt round-trip per type; search returns expected matches; lock clears store.

## Success Criteria
- [ ] All 5 types create/read/update/delete correctly; values survive round-trip.
- [ ] DB never stores readable secret fields (only `type`/`favorite` plaintext).
- [ ] Instant search (<50ms) across items; category/favorite filters work without decrypt.
- [ ] Items store empty after lock.

## Risk Assessment
- Large vault decrypt cost → fine at personal scale (<1000); decrypt once per unlock, cache in RAM.
- Schema drift → zod validation on read; tolerate unknown fields for forward-compat.
- Accidental plaintext to server → all writes go through `encryptJSON` before insert; lint/test guard (Phase 6).
