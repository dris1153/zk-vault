# 2026-06-06 - Docs split into focused pages

Restructured the in-app `/docs` from one long scroll page into 5 themed routes
under a shared layout, and updated the content for every feature shipped since v1.
Brainstorm -> plan -> cook -> commit on `origin/dev` (`76be463`).

## Structure
- `app/docs/layout.tsx` - shared shell (sticky header + a route-active left nav).
- `components/docs/docs-nav.tsx` ("use client") - the page list, active by
  `usePathname()` (exact match for `/docs`, prefix for the rest); a horizontal
  scroll row on mobile, vertical column on lg.
- Routes: `/docs` (Tổng quan + index cards), `/docs/bao-mat`, `/docs/tinh-nang`,
  `/docs/trien-khai`, `/docs/khoi-phuc`.
- Reused `doc-ui` + `doc-diagram` primitives; deleted the now-dead `doc-shell.tsx`
  + the four `sections/*` (content moved into the route pages - git tracked
  deployment.tsx as a rename to trien-khai/page.tsx).

## Content updates (cross-checked against code)
- Bảo mật: envelope + Argon2id/AES, the email-as-salt identity (entered at first
  login, localStorage, NOT env), RLS, and an honest threat model (leaked master =
  full compromise; biometric/TOTP are convenience, not extra factors; recovery key
  is a second root).
- Tính năng: 6 item types incl database (engine picker), TOTP/2FA, QR scanner,
  biometric unlock, password health (+ opt-in HIBP), tags multi-filter, search,
  auto-lock, clipboard auto-clear, favicons opt-in, PWA.
- Triển khai: fixed to 2 env vars, email at first login, the 0002 migration, the
  `verify:supabase <email>` arg, and a PWA install note.
- Khôi phục/FAQ: fixed stale facts (5 -> 6 item types; v1.5/v2 "coming" items are
  shipped; biometric/2FA are not extra security).

## Verification
`tsc` clean, `guard` clean, `build` passes - all 5 `/docs*` routes prerender as
static. No em-dashes. The route nav highlights the current page. Vietnamese copy
left for the user to proofread.
