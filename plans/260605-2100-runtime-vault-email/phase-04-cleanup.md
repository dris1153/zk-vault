---
phase: 4
title: "Cleanup env / docs / verify script"
status: pending
priority: P3
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Cleanup env / docs / verify script

## Overview
Remove the env var everywhere and update the docs + verify script to the new
"enter email at first login" model.

## Requirements
- Functional: nothing references `NEXT_PUBLIC_VAULT_EMAIL` anymore; the verify
  script gets its test email from a non-public source.

## Architecture
- `.env.local.example`: remove the `NEXT_PUBLIC_VAULT_EMAIL` block.
- `components/docs/sections/deployment.tsx`: drop the env var from the example +
  the step list; add a line that the email is entered at first login/signup.
- `supabase/README.md` + root `README.md`: remove the env var; note runtime email.
- `scripts/verify-supabase.ts`: take the test email from `process.argv[2]` or a
  script-only env var `VAULT_VERIFY_EMAIL` (NOT `NEXT_PUBLIC_*`); fail with a clear
  message if absent. Keep the plus-addressing test logic.

## Related Code Files
- Modify: `.env.local.example`, `components/docs/sections/deployment.tsx`,
  `supabase/README.md`, `README.md`, `scripts/verify-supabase.ts`

## Implementation Steps
1. Strip the env var from example + both READMEs + the docs deployment section.
2. Repoint `verify-supabase.ts` to a CLI arg / `VAULT_VERIFY_EMAIL`.
3. Add a short "you enter your email at first login" note to the docs deployment step.

## Success Criteria
- [ ] `grep -ri NEXT_PUBLIC_VAULT_EMAIL` returns nothing (outside old plan archives).
- [ ] Docs no longer instruct setting the email env var.
- [ ] `npm run verify:supabase <email>` still works.

## Risk Assessment
- Don't break the verify script's plus-addressing (it must not touch the real vault
  account) - keep that logic, only change the email source.
