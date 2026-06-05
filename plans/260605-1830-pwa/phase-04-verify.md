---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Verify

## Overview
Confirm the build produces a correct SW + manifest, the CSP still emits, no API
caching, and hand the device-level PWA checks to the user.

## Implementation Steps
1. `npx tsc --noEmit` - clean (watch SW global typings).
2. `npm run guard` - new files are client/config; no crypto/vault server import.
3. `grep` for em-dashes in new/changed files - none.
4. `npm run build` (prod) -> confirm:
   - `public/sw.js` exists and contains a precache manifest (a list of
     hashed build assets).
   - `app/sw.ts` has NO runtimeCaching rule for Supabase/APIs.
   - `/manifest.webmanifest` and `/icons/*.png` resolve.
   (If the build fails on a /_document or /404 prerender error, a server on :3000
   is locking `.next` - stop it and rebuild.)
5. Start prod (`npm start`) and `curl -sI http://localhost:3000` -> confirm the
   `Content-Security-Policy` header STILL emits (includes `manifest-src 'self'`,
   `worker-src 'self' blob:`).
6. USER DEVICE TEST (I cannot do install/offline here) - provide a checklist:
   - Install (Chrome "Install app" / iOS "Add to Home Screen") -> standalone window,
     correct icon + theme color.
   - Go offline -> the app shell / lock screen still loads (vault cannot open - expected).
   - Confirm in DevTools > Application: SW active, Cache Storage holds only static
     build assets (NO Supabase responses).
   - Deploy a new build -> the "Có bản cập nhật mới" toast appears -> "Tải lại" updates.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] `public/sw.js` generated with a precache manifest; no API cache rule.
- [ ] CSP header still emits (with manifest-src) after the Serwist wrap.
- [ ] User confirms install + offline shell + update prompt on a real device.

## Risk Assessment
- Cache Storage accidentally holding Supabase data -> the device test explicitly
  checks Cache Storage contents; the SW has no API rule by design.
