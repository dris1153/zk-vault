---
phase: 3
title: "Drawer Display"
status: pending
priority: P2
effort: "1-2h"
dependencies: [1]
---

# Phase 3: Drawer Display

## Overview
Show a live, rotating TOTP code with a countdown in the detail drawer for logins
that have a `totp_secret`, with a copy button.

## Requirements
- Functional: live 6-digit code (grouped 3+3), a 30s countdown ring/bar, a copy
  button (auto-clear via the existing clipboard hook). Empty `totp_secret` ->
  render nothing. Update once per second; cleaned up on item change/unmount.
- Non-functional: not shown on the card; < 200 lines.

## Architecture
- `components/totp-display.tsx` ('use client'): props `{ secret: string; onCopy?: (code) => void }`.
  - `parseTotp(secret)`; if null -> render a small "TOTP không hợp lệ" note.
  - 1s interval -> `currentCode`; show `formatCode(code)` (azure, mono), a ring or
    thin bar for `secondsRemaining/period`, and a copy button.
  - Clean the interval on unmount and when `secret` changes.
- `components/detail-drawer.tsx`: in the field loop, when `field.name === "totp_secret"`,
  render `<TotpDisplay secret={text} onCopy={(c) => copy("totp_secret", c)} />`
  instead of the generic `Row` (skip if empty). Keep the field label "Mã 2FA".
  Reuse the drawer's `copy` (useClipboard) so the clipboard auto-clears.

## Related Code Files
- Create: `components/totp-display.tsx`
- Modify: `components/detail-drawer.tsx`

## Implementation Steps
1. Build `totp-display.tsx` (live code + ring/bar + copy, 1s interval, cleanup).
2. Special-case `totp_secret` in the drawer field loop to render it.
3. Verify: open a login with a TOTP secret -> code rotates every 30s, countdown
   animates, copy works and clipboard auto-clears; a login without a secret shows
   no TOTP row.

## Success Criteria
- [ ] Drawer shows a rotating code + countdown + copy for logins with a secret.
- [ ] Invalid secret shows a clear note; empty shows nothing.
- [ ] Interval cleaned up on item change/unmount.

## Risk Assessment
- Timer drift / multiple intervals -> single interval keyed on `secret`, cleared
  on change; compute from `Date.now()` each tick (no accumulation).
