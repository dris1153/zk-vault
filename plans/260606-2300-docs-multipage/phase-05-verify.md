---
phase: 5
title: "Verify + cleanup"
status: pending
priority: P2
effort: "0.5-1h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Verify + cleanup

## Overview
Remove the now-dead single-page shell, confirm the build + nav, and do a final
stale-fact sweep.

## Implementation Steps
1. Delete (or repurpose) `components/docs/doc-shell.tsx` and the moved
   `components/docs/sections/*` once their content lives in the new pages. Keep
   `doc-ui.tsx` + `doc-diagram.tsx` (still used).
2. `npx tsc --noEmit` - clean.
3. `npm run guard` - passes (docs are client/server UI; no crypto server import).
4. `grep` for em-dashes across the new doc pages - none.
5. `npm run build` - all 5 `/docs*` routes prerender. (A /_document or /404 error
   means a server on :3000 is locking `.next` - stop it and rebuild.)
6. Manual (`npm run dev`): visit each page from the left nav; the active route
   highlights; "Quay lại vault" works; the lock-screen + settings "/docs" links land
   on Tổng quan.
7. Final stale-fact sweep: env (2 vars), email at first login, 6 item types,
   biometric/TOTP/QR/health/PWA all described, HIBP opt-in, favicons off.

## Success Criteria
- [ ] tsc clean, guard pass, build pass (5 routes), no em-dashes.
- [ ] Left nav active-by-route; all pages reachable; entry links work.
- [ ] No stale facts remain; dead doc-shell/sections removed.

## Risk Assessment
- Deleting moved section files while still imported -> remove imports first (the old
  `app/docs/page.tsx` import list) to avoid a broken build.
