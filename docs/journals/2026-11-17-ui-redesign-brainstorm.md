# 2026-11-17 - UI redesign (Campsite) + 2FA-first brainstorm

Brainstorm + plan only, no code yet. DESIGN.md was switched by the user from Supabase (dark, Electric Azure) to Campsite (light, Parchment canvas, Midnight Ink, rationed Campfire Orange).

## Decisions
- Default screen after unlock becomes a Google-Authenticator-style "Mã 2FA" list; Vault moves to a second tab. Mobile bottom nav, desktop sidebar, tab kept in `?tab=`.
- New item type `authenticator` (needs migration 0003) + bulk import of Google Authenticator `otpauth-migration://` QR exports with a hand-written protobuf reader (no new dependency).
- Codes: tap row to copy, pinned (reuses `favorite`) then A-Z, no usage-based reorder, next-code preview at <= 5s, optional "Ẩn mã nơi công cộng".
- Unlock: auto passkey prompt on lock screen mount; `lockOnHidden` becomes a grace period (default 60s) so copy-then-switch-app no longer locks instantly.
- Semantic color tokens instead of color names; light only; CLAUDE.md "dark-only" to be updated.
- WCAG gaps in DESIGN.md flagged: Ash Gray text, white on orange, white on green all fail AA.

## Next

Plan at `plans/261117-1328-ui-redesign-2fa-first/` (4 phases: tokens/reskin, codes home, GA import + unlock UX, vault list). Brainstorm report at `plans/reports/brainstorm-261117-1328-ui-redesign-2fa-first.md`. Note `plans/` is gitignored.
