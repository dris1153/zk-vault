---
title: "Docs Multi-Page Restructure"
status: completed
priority: P2
created: 2026-06-06
feature: Split /docs into ~5 themed route pages + cover all features shipped since v1
blockedBy: []
blocks: []
---

# Docs Multi-Page Restructure - Plan

Split the single long `/docs` page into 5 focused route pages under a shared
layout with a left route-nav, and update the content for every feature shipped
since v1. Reuse the existing doc-ui / doc-diagram primitives. Vietnamese copy,
dark-only, DESIGN.md tokens, no em-dashes.

## Locked decisions
- Multi-route under `app/docs/`: a `layout.tsx` (header + client route-nav active by
  `usePathname()`) + 5 page routes. Drop the per-page scroll-spy TOC.
- Pages: `/docs` (Tổng quan), `/docs/bao-mat`, `/docs/tinh-nang`, `/docs/trien-khai`,
  `/docs/khoi-phuc`.
- Reuse doc-ui (DocSection/H3/P/InlineCode/CodeBlock/Callout/Steps/Bullets) +
  doc-diagram. Do NOT invent new styling.
- Entry links (lock-screen, settings) stay pointing at `/docs`.
- Docs only - no crypto/vault logic changes.

## Content accuracy (fix stale facts)
- Env: 2 vars (URL + ANON_KEY); the vault email is entered at first login (NOT env).
- Item types: SIX (login, wallet, ssh_key, secure_note, api_key, database).
- v1.5 roadmap items shipped: biometric (WebAuthn PRF), TOTP/2FA, QR scan.
- New: password health, PWA, runtime email identity, tags multi-filter, database type.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | layout (shell + route nav) + Tổng quan page | ✅ completed | [phase-01-layout-overview.md](./phase-01-layout-overview.md) |
| 2 | Bảo mật page (security + identity + threat model) | ✅ completed | [phase-02-bao-mat.md](./phase-02-bao-mat.md) |
| 3 | Tính năng page (all new features) | ✅ completed | [phase-03-tinh-nang.md](./phase-03-tinh-nang.md) |
| 4 | Triển khai + Khôi phục pages | ✅ completed | [phase-04-trien-khai-khoi-phuc.md](./phase-04-trien-khai-khoi-phuc.md) |
| 5 | Verify (tsc/guard/build + nav + cleanup) | ✅ completed | [phase-05-verify.md](./phase-05-verify.md) |

## Dependencies
1 -> 2 -> 3 -> 4 (sequential, share the layout); 5 last.

## Acceptance
- 5 routes build + prerender; left nav highlights the current route; all reachable.
- No stale facts (env vars, item types, email model, shipped features).
- doc-shell.tsx removed/repurposed; primitives reused; every file < 200 lines.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.

## Risks (brutal honesty)
- The hard part is writing accurate NEW Vietnamese content - cross-check each
  feature against the real code; risk is wrong/stale facts, not routing.
- Don't over-fragment (one page per feature) - keep 5 themed pages.
- Route-nav active state needs `usePathname()` -> the nav is a small client
  component; pages stay server components.
