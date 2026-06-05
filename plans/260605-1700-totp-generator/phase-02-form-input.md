---
phase: 2
title: "Form Input"
status: pending
priority: P2
effort: "1-2h"
dependencies: [1]
---

# Phase 2: Form Input

## Overview
Add a TOTP field to the Login add/edit form: a masked input + reveal, with a live
code preview that validates the secret as the user types/pastes.

## Requirements
- Functional: a `totp_secret` field on Login; masked input + reveal toggle; live
  preview ("Mã hiện tại: 824 519" if it parses, else an invalid hint); binds to
  the form `totp_secret` string.
- Non-functional: only Login gains the field; other types unchanged; < 200 lines.

## Architecture
- `lib/ui/item-fields.ts`: add `'totp'` to `FieldKind`; append to the LOGIN
  field list `{ name: "totp_secret", label: "Mã 2FA (secret hoặc otpauth://)", kind: "totp" }`
  (place after `url`, before `notes`).
- `components/totp-field.tsx` ('use client'): masked `TextInput` + reveal toggle
  (reuse the SecretInput pattern) + below it a live preview using `parseTotp` +
  `currentCode`; ticks each second (interval cleaned up on unmount). Invalid ->
  smoke-colored hint; valid -> azure code + small countdown number.
- `components/item-form.tsx`: render `<TotpField value onChange>` for kind `'totp'`.

## Related Code Files
- Create: `components/totp-field.tsx`
- Modify: `lib/ui/item-fields.ts`, `components/item-form.tsx`

## Implementation Steps
1. FieldKind += `'totp'`; add the login field.
2. Build `totp-field.tsx` (input + reveal + live preview, 1s interval).
3. Wire the `'totp'` branch in `item-form.tsx`.
4. Verify: add/edit login, paste a secret -> live preview updates; paste an
   otpauth URI -> still valid; garbage -> invalid hint.

## Success Criteria
- [ ] Login form shows the TOTP field with a live, validating preview.
- [ ] Value persists into `totp_secret` and round-trips on edit.
- [ ] Interval cleaned up (no leak / no update after unmount).

## Risk Assessment
- Per-keystroke parse cost -> trivial; parse is cheap and guarded.
- Field appears for Login only -> driven by FIELDS_BY_TYPE, no leakage to others.
