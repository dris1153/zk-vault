---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "0.5-1h"
dependencies: [1, 2, 3]
---

# Phase 4: Verify

## Overview
Confirm correctness, the lazy bundle split, zero-knowledge defaults, and a clean build.

## Implementation Steps
1. `npx tsc --noEmit` - clean.
2. `npm run guard` - the new files are client UI/util; not imported server-side.
3. `grep` for em-dashes in new/changed files - none.
4. `npm run build` - passes. Confirm zxcvbn is a SEPARATE lazy chunk, NOT folded
   into the `/` page's first-load JS (check the build output / chunk list).
   (If the build fails on a /_document or /404 prerender error, a server on :3000
   is locking `.next` - stop it and rebuild.)
5. Manual smoke (`npm run dev`):
   - Add two logins with the same password -> reused; add "123456" -> weak; badge
     shows the count; open the panel; click a row -> the item's drawer opens.
   - Settings -> enable HIBP -> "password" reports breached; Network tab shows only
     `api.pwnedpasswords.com/range/<prefix>` requests. Disable -> no requests.
   - Healthy vault -> empty state, no badge.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] zxcvbn is lazy-split (not in the main page first-load JS).
- [ ] Breach off by default -> no network; on -> k-anonymity only.
- [ ] Report contains no plaintext passwords.

## Risk Assessment
- If the bundler inlines zxcvbn into the main chunk, revisit the dynamic import
  (ensure it is a real `await import()` not a static import).
