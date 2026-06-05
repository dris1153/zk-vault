---
title: "Login Platform Picker"
status: completed
priority: P2
created: 2026-06-05
feature: Replace login URL text field with a platform combobox; resolve logo/name from URL at display time
blockedBy: []
blocks: []
---

# Login Platform Picker - Plan

Replace the free-text URL field on Login items with a searchable platform
combobox (logos + category groups) + a custom-URL option. The platform logo/name
is resolved from the stored `url` domain at render time, so new platforms added
later auto-light existing items with zero data migration.

## Core decisions (locked)
1. **No schema change.** Login keeps `url: string`. No `platform` field stored.
   Platform resolved from the URL domain via a static registry at display time.
2. **No data migration ever** - "adding a platform later" works because display
   resolves from `url`, not from a stored platform id.
3. **Icons bundled** via npm `developer-icons` (no CDN); local PNG for brands not
   in the package (e.g. Zalo); monogram for unknown custom domains.
4. **Favicon is opt-in** (default off, leaks domain to a third party) - the only
   thing that touches the network, gated behind a setting + CSP allowance.
5. Do NOT touch `lib/crypto` or the vault engine. Zero-knowledge stays intact.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Platform registry + icon resolution (+ deps, placeholders) | ✅ completed | [phase-01-registry-icons.md](./phase-01-registry-icons.md) |
| 2 | Platform picker combobox + form wiring | ✅ completed | [phase-02-picker.md](./phase-02-picker.md) |
| 3 | Display updates (card + drawer) | ✅ completed | [phase-03-display.md](./phase-03-display.md) |
| 4 | Favicon opt-in (settings + CSP) | ✅ completed | [phase-04-favicon-optin.md](./phase-04-favicon-optin.md) |
| 5 | Verify (tsc, guard, build) | ✅ completed | [phase-05-verify.md](./phase-05-verify.md) |

## Dependencies
1 → 2 → 3 (sequential). 4 depends on 1 (uses platform-icon). 5 last.

## Acceptance
- `npx tsc --noEmit` clean, `npm run guard` passes (no improper crypto/vault
  imports), `npm run build` passes.
- Picking a platform fills `url`; display shows its logo. Custom URL works.
- Existing login items resolve a logo from their stored `url` with no migration.
- Favicon off by default; no external request unless the user opts in.
- No em-dashes in UI copy; dark-only; DESIGN.md azure tokens.

## Out of scope
- Editing brand PNGs (user replaces placeholders).
- Platform picker for non-login types.
