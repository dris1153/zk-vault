---
phase: 6
title: "Hardening"
status: pending
priority: P2
effort: "2d"
dependencies: [3, 4, 5]
---

# Phase 6: Hardening

## Overview
Security finish: clipboard auto-clear, recovery-key generation/restore UX, encrypted export/import, web supply-chain mitigations (CSP/SRI/pinned deps), and a CI guard against plaintext-to-server leaks.

## Requirements
- Functional: copy auto-clears after N seconds with countdown; recovery words shown once on provisioning + restore flow; export/import encrypted `.vault` bundle; change-master re-wrap; settings controls wired.
- Non-functional: strict CSP; pinned minimal deps; CI check that vault crypto/data never imported in server context.

## Architecture
- **Clipboard auto-clear** (`lib/ui/clipboard.ts`): `copyWithClear(text, seconds)` writes, starts countdown, overwrites clipboard with empty/space after timeout; drawer shows live countdown. Best-effort (browser clipboard limits documented).
- **Recovery key** (`components/recovery-key-dialog.tsx`): on provisioning, show 24-word numbered grid once, require "I stored it" confirm; never re-displayable in plaintext (regenerate = new key, re-wrap DEK). Restore: lock-screen "Use recovery key" → 24-word input → `unlockWithRecovery` → force set-new-master.
- **Export/Import** (`lib/vault/export.ts`): export = bundle `{vault_config (wrapped keys + kdf_params), items: [{type, favorite, encrypted_data, iv}]}` as `.vault` JSON. Already ciphertext; still requires master/recovery to decrypt. Import = validate + upsert rows (with confirm/merge strategy). Document: export is a backup, not a second plaintext copy.
- **Supply-chain** (`next.config` headers + deps): strict `Content-Security-Policy` (no inline/eval where avoidable, locked connect-src to Supabase), SRI on any CDN asset (prefer self-hosted/bundled — avoid runtime CDNs), pin exact dep versions, minimize dependency count.
- **CI guard** (`scripts/check-no-plaintext-server.mjs` + test): assert `lib/vault/*` and `lib/crypto/*` are not imported by any server component / route handler / server action; grep for `'use server'` files importing the vault layer → fail build.

## Related Code Files
- Create: `lib/ui/clipboard.ts`
- Create: `components/recovery-key-dialog.tsx`
- Create: `lib/vault/export.ts` (export/import)
- Create: `scripts/check-no-plaintext-server.mjs` (CI guard)
- Modify: `next.config.*` (security headers / CSP)
- Modify: `components/settings.tsx` (wire timeout, clipboard delay, change master, recovery, export/import)
- Modify: `components/detail-drawer.tsx` (use `copyWithClear` + countdown)
- Modify: `package.json` (pin versions; add CI script)

## Implementation Steps
1. Implement `copyWithClear` + drawer countdown UI; setting for delay (10/20/30s).
2. Recovery dialog (show-once) on provisioning; restore + set-new-master flow on lock screen.
3. Export/import `.vault`; round-trip test (export → wipe → import → unlock).
4. `changeMaster` settings action (re-wrap only; verify items unchanged).
5. Add CSP + security headers in `next.config`; remove runtime CDNs (bundle Phosphor/fonts); pin deps.
6. CI guard script + npm script; add to lint/test pipeline.
7. Final pass: auto-lock timeout setting, "require master on reveal" toggle.

## Success Criteria
- [ ] Copy auto-clears after configured delay; countdown visible.
- [ ] Recovery words shown once, confirmable; restore path unlocks + forces new master.
- [ ] Export → fresh import → unlock recovers full vault.
- [ ] Change-master re-wraps DEK without touching items.
- [ ] CSP active; no runtime CDN; deps pinned.
- [ ] CI guard fails if any server module imports the vault/crypto layer.

## Risk Assessment
- Clipboard clear is best-effort (browsers may block) → document limitation; minimize copy lifetime.
- Export = encrypted backup, not extra exposure → never offer plaintext export; make this explicit in UI copy.
- Web supply-chain (served JS tampering) → CSP + SRI + bundled (no CDN) + pinned deps; note residual risk, v2 PWA/extension.
- Lost recovery key AND master → truly unrecoverable; UI must state this plainly at provisioning.
