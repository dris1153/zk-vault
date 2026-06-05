---
phase: 1
title: "Serwist + Service Worker"
status: pending
priority: P2
effort: "2-3h"
dependencies: []
---

# Phase 1: Serwist + Service Worker

## Overview
Install Serwist, wrap the Next config (preserving the CSP headers), and write a
minimal SW that precaches the static build and never caches Supabase/API responses.

## Requirements
- Functional: production build emits `public/sw.js` with a precache manifest; the
  app shell loads offline; Supabase requests pass through to the network (uncached).
- Non-functional: SW disabled in dev; existing CSP `headers()` preserved; < 200 lines.

## Architecture
- Install `serwist` + `@serwist/next`.
- `next.config.ts`:
  - `import withSerwistInit from "@serwist/next";`
  - `const withSerwist = withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV === "development", reloadOnOnline: true });`
  - `export default withSerwist(nextConfig);` - keep the existing `nextConfig`
    (reactStrictMode + `headers()` CSP) intact; the wrap must not drop headers.
  - Add `manifest-src 'self'` to the CSP directive list.
  - May need a `tsconfig`/types reference for the SW global (`@serwist/next/typings`).
- `app/sw.ts`:
  - `import { defaultCache } from "@serwist/next/worker"` is AVAILABLE but we do NOT
    use the broad defaultCache. Instead:
  - `import { Serwist } from "serwist";` + `import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";`
  - `declare global { interface WorkerGlobalScope extends SerwistGlobalConfig { __SW_MANIFEST: (PrecacheEntry | string)[] | undefined } }`
  - `declare const self: ServiceWorkerGlobalScope;`
  - `const serwist = new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting: false, clientsClaim: true, navigationPreload: true, runtimeCaching: [/* NONE for APIs */] });`
  - Optional: a `NavigationRoute`/`NetworkFirst` for navigations so the shell is
    available offline (or rely on precache + index). Keep runtimeCaching empty or
    static-only.
  - `serwist.addEventListeners();`
  - Add a listener: `self.addEventListener("message", (e) => { if (e.data?.type === "SKIP_WAITING") self.skipWaiting(); });` (used by the update prompt).
  - COMMENT clearly: never add a runtimeCaching rule for Supabase or any API.

## Related Code Files
- Create: `app/sw.ts`
- Modify: `next.config.ts` (Serwist wrap + manifest-src), `package.json` (deps),
  possibly `tsconfig.json` (SW lib types: `"webworker"`)

## Implementation Steps
1. `npm install serwist @serwist/next`.
2. Wrap `next.config.ts` (keep headers) + add `manifest-src 'self'`.
3. Write `app/sw.ts` (precache manifest, skipWaiting:false, SKIP_WAITING handler).
4. Ensure SW TS compiles (webworker lib / serwist typings).
5. `npm run build` (prod) -> confirm `public/sw.js` is generated with precache entries.

## Success Criteria
- [ ] Prod build emits `public/sw.js` containing a precache manifest.
- [ ] CSP headers still emit (verify after the wrap).
- [ ] No runtimeCaching rule for Supabase/APIs.
- [ ] Dev build has the SW disabled.

## Risk Assessment
- Serwist wrap dropping `headers()` -> verify the header still emits (curl) after wrapping.
- SW TS globals (`self.__SW_MANIFEST`, ServiceWorkerGlobalScope) -> add the webworker
  lib + serwist typings; isolate the `declare` in app/sw.ts.
- Accidental API caching -> keep runtimeCaching empty/static-only; comment the rule.
