# 2026-06-05 - Post-v1 enhancements

Iterative polish on the zk-vault after v1: an in-app docs page, a production CSP
bug fix, a Tailwind v4 cursor fix, a login platform picker, and a custom brand
logo. Each went through brainstorm -> approve -> cook. Pushed to `origin/dev`.

## CSP / WASM bug (production-only, build-passed but runtime-broke)
Create-vault threw `WebAssembly.compile() violates CSP` in production. Root
cause: the Phase 6 CSP `script-src` had no WASM allowance, and hash-wasm
(Argon2id) compiles a WebAssembly module at unlock/create time. Dev masked it
because dev's `'unsafe-eval'` also permits WASM; prod (no `'unsafe-eval'`) broke.
Fix: add `'wasm-unsafe-eval'` (permits WASM compilation only, NOT general eval -
keeps XSS protection). Lesson: `npm run build` passing != runtime-correct for
client WASM under CSP; the crypto runs on user interaction, not at build/SSR.

## Tailwind v4 cursor regression
Buttons felt dead because v4's Preflight no longer sets `cursor: pointer` on
`<button>` (matches native default). Fixed once with a global `@layer base` rule
rather than per-component classes, and added the rule to the global dev rules so
future projects don't repeat it.

## Login platform picker (no migration by design)
Replaced the free-text login URL with a searchable platform combobox (logos +
category groups) + custom-URL option. Key decision: **store only `url`, resolve
the platform from the domain at render time** via a static registry - so adding a
platform later auto-lights existing items with ZERO data migration (no decrypt +
rewrite of encrypted rows). Icons bundled via `developer-icons` (no CDN); local
PNG placeholders for brands not in the package (Zalo); monogram for unknown
domains. Favicon for custom domains is **opt-in** (default off) because fetching
a favicon leaks the stored domain to a third party - antithetical to a
zero-knowledge vault. Multi-domain matching per platform (exact-then-subdomain).

## Brand logo
Replaced the generic Phosphor `Vault` icon with a custom isometric "vault cube,
ajar lid" SVG mark in the DESIGN.md line-art + azure-accent language. One source
(`BrandMark`, tile/flat variants), wired into lock screen, sidebar, docs, empty
state, and a new `app/icon.svg` favicon. Chosen from 3 rendered candidates.

## Docs page
Public `/docs` route (Vietnamese, with custom React/SVG flow diagrams) covering
storage workflow, unlock flow, deployment A-Z (Vercel + Supabase), and recovery.
Kept the crypto/vault layer out of it (guard passes).

## Verification
All changes: `tsc` clean, `npm run guard` clean (crypto/vault stays client-only),
`npm run build` passes. Recurring gotcha: a dev/prod server on :3000 locks
`.next` on Windows and corrupts concurrent builds (shows as a `/_document` /404
prerender error) - stop it and rebuild.
