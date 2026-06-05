---
phase: 3
title: "UI Wiring"
status: pending
priority: P2
effort: "2-3h"
dependencies: [2]
---

# Phase 3: UI Wiring

## Overview
Surface biometric in the UI: an unlock button on the lock screen, an enable/disable
toggle in Settings, and clearing on master-password change.

## Requirements
- Functional: lock screen shows "Mở bằng vân tay/Face" when a credential exists;
  Settings Security tab shows Enable (with a master input) when supported & not
  enrolled, Disable when enrolled, hidden when unsupported; change-master clears it.
- Non-functional: master fallback always visible; no em-dashes; DESIGN.md tokens.

## Architecture
- `components/lock-screen.tsx`:
  - On mount (effect), check `hasBiometric()` -> if true and mode is "unlock",
    render a prominent biometric button above/below the master form that calls
    `unlockWithBiometric()`. On failure, show an inline note and keep the master form.
  - Do NOT auto-trigger the biometric prompt on load; require a tap.
- `components/settings-dialog.tsx` (Security tab):
  - Resolve `{ supported, enrolled }` in an effect. If `!supported` -> render nothing
    for biometric. If supported & !enrolled -> a row with a small master-password
    input + "Bật" button (`enableBiometric(master)`), with a one-line note that it
    stores a device-bound key. If enrolled -> a "Tắt" button (`disableBiometric`).
    Refresh state after enable/disable.
- `lib/vault/change-master.ts`:
  - After the successful path (auth + wrap persisted), `await clearBiometric()` and
    set a status note like "Đã đổi master. Bật lại vân tay nếu muốn." (the existing
    success message can mention it).

## Related Code Files
- Modify: `components/lock-screen.tsx`, `components/settings-dialog.tsx`,
  `lib/vault/change-master.ts`

## Implementation Steps
1. Lock screen: async `hasBiometric` check + biometric button + fallback handling.
2. Settings: supported/enrolled resolve + Enable(master input)/Disable rows.
3. change-master: clearBiometric + note.
4. Smoke: enable in Settings, lock, see the button on the lock screen, unlock; then
   change master -> biometric gone + note -> re-enable works.

## Success Criteria
- [ ] Biometric button appears only when enrolled; master fallback always present.
- [ ] Settings enable/disable works and reflects state immediately.
- [ ] Changing master clears biometric and tells the user to re-enable.
- [ ] Unsupported browser: no biometric UI anywhere; app unaffected.

## Risk Assessment
- Async support/enrolled checks must not cause hydration mismatch -> compute in
  effects, default to hidden until resolved.
- Enable requires an unlocked session (DEK in RAM) -> Settings is only reachable
  when unlocked, so this holds; still guard `enableBiometric` against a locked state.
