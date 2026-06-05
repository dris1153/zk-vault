---
phase: 4
title: "Triển khai + Khôi phục"
status: pending
priority: P2
effort: "1.5-2h"
dependencies: [3]
---

# Phase 4: Triển khai + Khôi phục pages

## Overview
The deployment page (updated for the new env + migrations) and the recovery + FAQ
page (updated facts).

## Requirements
- Functional: accurate, current deployment + recovery instructions.
- Non-functional: reuse the Steps/Callout primitives; < 200 lines/file.

## Architecture
- `app/docs/trien-khai/page.tsx` (port + fix `deployment.tsx`):
  - Supabase project; `.env.local` with TWO vars (URL + ANON_KEY); the vault email
    is entered at first login (NOT env). Optional `SUPABASE_DB_URL` for db:reset.
  - Disable email confirmation.
  - Apply migrations: `0001_init.sql` + `0002_add_database_type.sql` (or `db:reset`).
  - `npm run verify:supabase <email>` (now takes the email as an arg).
  - Local dev + Vercel deploy (only the 2 env vars in Vercel).
  - Short "Cài app (PWA)" note: install from the browser; offline shell.
- `app/docs/khoi-phuc/page.tsx` (port + fix `recovery-faq.tsx`):
  - Export the encrypted `.vault` backup; recover via the file + the 24-word key.
  - Change master password (rotates auth + re-wraps; clears biometric).
  - FAQ: update stale items - SIX item types now (incl database); biometric + 2FA
    shipped; email is entered at first login.

## Related Code Files
- Create: `app/docs/trien-khai/page.tsx`, `app/docs/khoi-phuc/page.tsx`
- Reuse/move: `components/docs/sections/{deployment,recovery-faq}.tsx`
- Reuse: `doc-ui`

## Implementation Steps
1. Port deployment content, fixing the env (2 vars), migrations (0002), verify arg,
   and add the PWA note.
2. Port recovery + FAQ, fixing the stale facts.

## Success Criteria
- [ ] Deployment: 2 env vars, email at first login, 0002 migration, verify arg, PWA note.
- [ ] Recovery + FAQ accurate (6 types, shipped features).

## Risk Assessment
- The old deployment section lists 3 env vars + `npm run verify:supabase` with no
  arg -> both are now wrong; fix them.
