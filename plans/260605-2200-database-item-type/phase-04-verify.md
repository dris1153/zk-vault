---
phase: 4
title: "Verify"
status: pending
priority: P2
effort: "0.5h"
dependencies: [1, 2, 3]
---

# Phase 4: Verify

## Implementation Steps
1. `npx tsc --noEmit` - clean (all `Record<VaultItemType, ...>` maps filled).
2. `npm run guard` - passes.
3. `grep` for em-dashes in new/changed files - none.
4. `npm run build` - passes. (A /_document or /404 prerender error means a server on
   :3000 is locking `.next` - stop it and rebuild.)
5. Manual (`npm run dev`, after applying the 0002 migration to the live DB):
   - Sidebar shows "Databases"; New item -> the type picker shows Database.
   - Create a Database item: pick an engine (logo appears), fill host/port/db/
     username/password, save.
   - Card shows `engine · host`; open the drawer -> engine logo + label + structured
     fields, password masked with reveal + copy.
   - Existing items (login/wallet/...) still work.

## Success Criteria
- [ ] tsc clean, guard pass, build pass, no em-dashes.
- [ ] Database type end-to-end: create -> card -> drawer with engine logo.
- [ ] No regression to existing types.

## Risk Assessment
- If save fails with a constraint error, the 0002 migration was not applied to the
  live DB -> apply it (SQL editor or `db:reset`).
