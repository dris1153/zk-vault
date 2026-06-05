---
phase: 5
title: "UI"
status: completed (build + typecheck pass; pending your visual run)
priority: P2
effort: "3-4d"
dependencies: [3, 4]
---

# Phase 5: UI

## Overview
Build the React/Next.js UI matching the approved mockup and DESIGN.md azure system: lock screen, app shell (sidebar + topbar), card grid, detail drawer, add/edit modal, settings. Translate the static mockup into real components wired to Phases 3–4.

## Requirements
- Functional: unlock UX, category/tag sidebar with counts, instant search, card grid grouped by category, detail drawer (reveal/copy), add/edit modal (dynamic form per type), settings.
- Non-functional: matches DESIGN.md tokens exactly; dark-only; WCAG AA; keyboard nav (⌘K search, Esc close); honors `prefers-reduced-motion`; no AI-tells; no em-dashes in copy.

## Architecture
- **Tokens:** import DESIGN.md `@theme` block into `app/globals.css` (Tailwind v4). Fonts via `next/font`: Inter (Circular substitute) + Source Code Pro (secret values). Icons: `@phosphor-icons/react` (strokeWidth 1.5), one family.
- **Components** (mirror [mockup/vault-mockup.html](./mockup/vault-mockup.html)):
  - `components/lock-screen.tsx` — master pw / recovery entry, "Decrypting…" state, error/shake.
  - `components/app-shell.tsx` — grid layout 240px sidebar + main.
  - `components/sidebar.tsx` — categories + counts (from plaintext `type`), tags, settings link; active = azure accent.
  - `components/top-bar.tsx` — search (instant, ⌘K), Add pill, lock button.
  - `components/item-grid.tsx` + `item-card.tsx` — grouped cards, masked secondary, type-icon azure, empty/loading states.
  - `components/detail-drawer.tsx` — per-type field rows; reveal toggle; copy (hooks Phase 6 clipboard-clear); wallet seed as numbered word grid; TOTP slot (v1.5, disabled placeholder).
  - `components/add-edit-modal.tsx` — type selector → dynamic zod-driven form; password generator; save → encrypt+persist (Phase 4).
  - `components/settings.tsx` — auto-lock timeout, clipboard delay, change master, recovery key, export/import (Phase 6 wiring).
- **State:** consume `useVault()` (Phase 3) + items store/search (Phase 4). All vault components are `'use client'`.
- **Routing:** single authenticated app surface; locked state renders lock-screen overlay (no separate route needed).

## Related Code Files
- Create: `app/globals.css` (DESIGN.md @theme tokens), `app/page.tsx`, `app/layout.tsx`
- Create: `components/*` as listed above
- Create: `lib/ui/icons.ts` (type → Phosphor icon map)
- Modify: `tailwind`/postcss config for v4; `package.json` (`@phosphor-icons/react`, shadcn primitives as needed)

## Implementation Steps
1. Scaffold App Router shell; wire `vault-provider` in `layout.tsx`; load fonts + tokens.
2. Build `lock-screen` against `useVault().unlock` (master + recovery), with loading/error states.
3. Build `app-shell` + `sidebar` + `top-bar`; counts from store; search wired to `useSearch`.
4. Build `item-grid`/`item-card` with empty + skeleton-loading states.
5. Build `detail-drawer` with per-type rows, reveal, copy stub, wallet seed grid.
6. Build `add-edit-modal` with dynamic forms (zod schemas) + password generator.
7. Build `settings` shell (controls wired in Phase 6).
8. Pre-flight: token fidelity, contrast, reduced-motion, keyboard nav, zero em-dashes.

## Success Criteria
- [ ] Visual parity with mockup + DESIGN.md tokens (azure, borders, radii, fonts).
- [ ] Unlock → browse → search → open drawer → add/edit all functional against real crypto/Supabase.
- [ ] Empty/loading/error states present everywhere.
- [ ] Keyboard: ⌘K search, Esc closes drawer/modal, arrow nav in list.
- [ ] Reduced-motion respected; dark-only; no em-dashes; icons from Phosphor only.

## Risk Assessment
- Server/client boundary slip → vault components are client leaves; no secret in server components/actions.
- Token drift from DESIGN.md → import the `@theme` block verbatim; no ad-hoc colors.
- Form complexity (5 types) → drive forms from zod schemas (single source) to stay DRY.
