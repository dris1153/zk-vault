# 2026-06-06 - Docs user zone (User/Developer split)

Expanded the in-app docs to serve end users, not just deployers: the left nav is
now grouped into Người dùng / Nhà phát triển, with a getting-started page and a
how-to guide. Brainstorm -> plan -> cook -> commit on `origin/dev` (`74d0ee1`).

## What
- `components/docs/docs-nav.tsx`: flat list -> two labelled groups (Người dùng:
  Tổng quan, Bắt đầu, Hướng dẫn dùng, Khôi phục & FAQ; Nhà phát triển: Bảo mật &
  kiến trúc, Triển khai). Active-by-pathname kept; mobile horizontal scroll kept.
- `app/docs/page.tsx` (Tổng quan): reworked to be user-first - a "Tính năng nổi bật"
  list + updated index cards.
- `app/docs/bat-dau/page.tsx` (NEW): the first-run flow in 4 steps - create vault,
  save the 24-word recovery key (warn callout), unlock (remembered email / biometric),
  install the PWA. Friendly, non-technical.
- `app/docs/tinh-nang/page.tsx`: reworked from a feature catalog into a step-by-step
  how-to (add/edit items, login platforms, 2FA + QR, database engine, biometric,
  password health, tags + Any/All filter, Ctrl/Cmd+K search, Settings, PWA).
- Existing URLs kept (no link rot); the developer pages stayed technical.

## Accuracy
Each how-to step was cross-checked against the real UI (the + Add button, the
sidebar "Kiểm tra bảo mật" entry, Ctrl/Cmd+K, the Settings toggles, the tag Any/All
toggle, biometric enable in Settings) so the docs don't teach a non-existent flow.

## Verification
`tsc` clean, `guard` clean, `build` passes - all 6 `/docs*` routes prerender static
(incl the new `/docs/bat-dau`). No em-dashes. Vietnamese copy left for the user to
proofread. The README + a WIP `lib/ui/platforms.ts` (Riot game category) were left
unstaged as the user's separate in-progress work.
