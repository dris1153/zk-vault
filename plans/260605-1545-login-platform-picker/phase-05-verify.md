---
phase: 5
title: "Verify"
status: pending
priority: P2
effort: "0.25d"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Verify

## Overview
Confirm the feature is correct, zero-knowledge intact, and the build is clean.

## Requirements
- Functional: all acceptance criteria across phases pass.
- Non-functional: tsc clean, guard passes, build passes, no em-dashes.

## Implementation Steps
1. `npx tsc --noEmit` - clean.
2. `npm run guard` - new files must not import `lib/crypto` / `lib/vault` from a
   server context (they are client/presentational; platform-icon/picker are UI).
3. `grep` for em-dashes (`—`, `–`) in new/changed components - none.
4. `npm run build` - passes; confirm no CDN icon requests in the bundle.
5. Manual smoke: add GitHub login (logo on card+drawer), add custom-domain login
   (monogram), toggle favicon on (favicon shows), off (monogram, no request),
   edit an existing login (platform resolves).

## Success Criteria
- [ ] tsc clean, guard pass, build pass.
- [ ] No em-dashes; dark-only; DESIGN.md tokens respected.
- [ ] No external request with favicon OFF.
- [ ] Existing items resolve logos with no data migration.

## Risk Assessment
- developer-icons bundle size -> check the build output; tree-shake (import only
  used brand components, not the whole package).
