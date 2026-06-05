---
title: "PWA Packaging (v2b)"
status: completed
priority: P2
created: 2026-06-05
feature: Installable PWA with static precache (offline shell + supply-chain pinning), via Serwist
blockedBy: []
blocks: []
---

# PWA Packaging (v2b) - Plan

Make the app an installable PWA that precaches the static build: installable +
faster loads + supply-chain pinning (the served JS is cached locally, not
re-fetched each load). PACKAGING ONLY - NOT offline vault access.

## Locked decisions
1. **Serwist** (`serwist` + `@serwist/next`); update-prompt client via `@serwist/window`.
2. **SW precache static only** (`self.__SW_MANIFEST`) + navigation fallback. NO
   runtime-cache rule for Supabase/APIs - they pass straight to the network and
   are NEVER cached.
3. **skipWaiting: false** + a "new version, reload" prompt (user-controlled update).
4. Disabled in dev; active only in production builds.
5. Do NOT touch lib/crypto or the vault engine.

## Honest scope
- Offline -> only the app shell/lock screen loads; the vault CANNOT be opened
  offline (data is in Supabase, unlock needs network). True offline-vault is a
  separate, larger feature (cache ciphertext + offline unlock) - out of scope.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Serwist install + next.config wrap + app/sw.ts | ✅ completed | [phase-01-serwist-sw.md](./phase-01-serwist-sw.md) |
| 2 | Manifest + generated icons + themeColor | ✅ completed | [phase-02-manifest-icons.md](./phase-02-manifest-icons.md) |
| 3 | Update-prompt client + layout mount | ✅ completed | [phase-03-update-prompt.md](./phase-03-update-prompt.md) |
| 4 | Verify (tsc/guard/build + sw.js + CSP) | ✅ completed | [phase-04-verify.md](./phase-04-verify.md) |

## Dependencies
1 -> 2 -> 3 (sequential); 4 last.

## Acceptance
- `npm run build` emits `public/sw.js` with a precache manifest; the CSP headers
  still emit after the Serwist wrap; the manifest + icons resolve.
- No runtime-cache rule for Supabase exists in the SW.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.
- USER device test: installable, offline shell loads, update prompt appears on a
  new deploy (I cannot test install/offline here).

## Risks (brutal honesty)
- **No offline vault** - only the shell loads offline; opening the vault needs network.
- **Supply-chain caching is double-edged** - a bad cached build persists until the
  SW updates -> mitigated by the update prompt (and keep the SW minimal).
- **SW caching discipline** - any accidental runtime-cache of a Supabase response
  would persist vault data on disk -> NetworkOnly passthrough, no API cache rule.
- SW disabled in dev -> only testable in a production build.

## Next (separate/optional)
v2 remaining: **nonce-based CSP** (high effort vs static rendering; the team leans
toward dropping it for a self-hosted personal app). Its own cycle if pursued.
