---
phase: 3
title: "EngineSelect + form + drawer"
status: pending
priority: P2
effort: "1.5-2h"
dependencies: [2]
---

# Phase 3: EngineSelect + form + drawer

## Overview
The engine select component (native select + logo), wiring it into the item form,
and rendering the `db_engine` field in the detail drawer.

## Requirements
- Functional: pick an engine (logo shows for the selection); form stores the value;
  drawer shows the engine logo + label.
- Non-functional: dark, DESIGN.md tokens, < 200 lines, no em-dashes.

## Architecture
- `components/engine-select.tsx` (new):
  - Props `{ value: string; onChange: (v: string) => void }`.
  - A wrapper with the selected engine's logo (`engineIcon(value)`) on the left and
    a native `<select>` listing `DB_ENGINES` (value/label). Styled to match TextInput
    (border-slate, bg-obsidian, focus:border-azure). A placeholder option when empty.
  - The logo updates as the selection changes.
- `components/item-form.tsx`:
  - Add a branch for `f.kind === "db_engine"` -> `<EngineSelect value={str} onChange={(v)=>set(f.name,v)} />`.
- `components/detail-drawer.tsx`:
  - Find where fields render per kind. Add handling for `db_engine`: show the engine
    logo + `engineLabel(value)` as a normal (non-secret, non-copy or copy-as-text)
    row. Must NOT treat it as a secret. Confirm the existing default render path and
    where to branch.

## Related Code Files
- Create: `components/engine-select.tsx`
- Modify: `components/item-form.tsx`, `components/detail-drawer.tsx`

## Implementation Steps
1. Build `EngineSelect` (native select + logo + app styling).
2. Wire the `db_engine` branch in `item-form`.
3. Render `db_engine` in the drawer (logo + label).
4. Smoke: create a database item, pick Postgres -> logo shows; save; open drawer ->
   engine logo + host/port/db/username + masked password.

## Success Criteria
- [ ] EngineSelect shows the selected engine logo + a working native dropdown.
- [ ] The form saves the engine value; the drawer shows logo + label.
- [ ] Password stays masked with reveal; other fields render as text.

## Risk Assessment
- Drawer field-rendering may assume known kinds -> ensure `db_engine` has an explicit
  branch and does not fall into the secret path.
- Native select styling on dark -> set text/bg colors so options are readable
  (OS-rendered option list may use system colors; acceptable).
