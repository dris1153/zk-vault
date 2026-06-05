---
phase: 2
title: "Platform Picker Combobox + Form Wiring"
status: pending
priority: P2
effort: "0.5d"
dependencies: [1]
---

# Phase 2: Platform Picker Combobox + Form Wiring

## Overview

A searchable combobox that sets the login `url` by picking a platform or entering
a custom URL, wired into the dynamic item form via a new `'platform'` field kind.

## Requirements

- Functional: search + category-grouped options with logos; select sets
  `url = platform.domains[0]`; a "Custom URL" entry reveals a free-text input;
  reflects the current `url` (resolved platform or custom).
- Non-functional: keyboard accessible (Esc closes, type to filter), DESIGN.md
  tokens, < 200 lines.

## Architecture

- `components/platform-picker.tsx` ('use client'):
  - Props `{ value: string; onChange: (url: string) => void }` (binds the form `url`).
  - State: `open`, `query`, `custom` (bool). Resolve `findPlatform(value)` for the trigger.
  - Trigger button: PlatformIcon + platform name, or "URL tùy chỉnh" + the raw value, or placeholder "Chọn nền tảng".
  - Dropdown panel: search input; list grouped by `CATEGORY_ORDER` filtered by `query` (match name/domain); each row = PlatformIcon + name, onClick -> `onChange(p.domains[0])` + close.
  - Footer/option "URL tùy chỉnh" -> sets `custom=true`, shows a `TextInput` bound to `value` (free text). Toggling back to a platform clears custom.
  - Click-outside / Esc closes.
- `lib/ui/item-fields.ts`: change the login `url` field `kind: 'text'` -> `kind: 'platform'` (add `'platform'` to `FieldKind`). Keep label "URL / Nền tảng".
- `components/item-form.tsx`: render `<PlatformPicker value onChange>` when `f.kind === 'platform'` (other kinds unchanged).

## Related Code Files

- Create: `components/platform-picker.tsx`
- Modify: `lib/ui/item-fields.ts` (FieldKind + login url kind)
- Modify: `components/item-form.tsx` (render picker for kind 'platform')

## Implementation Steps

1. Add `'platform'` to `FieldKind`; set login's url field to that kind.
2. Build `platform-picker.tsx` (trigger + dropdown + search + grouped list + custom-URL toggle).
3. Wire into `item-form.tsx`.
4. Verify add/edit login: pick GitHub -> url becomes `github.com`; switch to custom -> free text; reopening an existing login resolves its platform.

## Success Criteria

- [ ] Picking a platform sets the form `url` to its primary domain.
- [ ] Custom URL entry stores arbitrary text.
- [ ] Editing an existing login reflects the resolved platform (or custom).
- [ ] Other field kinds (text/secret/textarea/tags) unchanged.

## Risk Assessment

- Combobox is custom (no lib) -> keep interaction minimal (click + type filter + Esc); avoid fragile focus traps.
- Ambiguous value (looks like a platform but user wants custom) -> the explicit "Custom URL" toggle resolves it.
