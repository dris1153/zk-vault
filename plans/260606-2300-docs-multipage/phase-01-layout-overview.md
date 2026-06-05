---
phase: 1
title: "Layout + Tổng quan"
status: pending
priority: P2
effort: "1.5-2h"
dependencies: []
---

# Phase 1: Layout (shell + route nav) + Tổng quan page

## Overview
The shared docs layout (sticky header + left route nav active by pathname) and the
`/docs` index page.

## Requirements
- Functional: every `/docs/*` route renders inside the shared shell with a nav that
  highlights the current route; the index page introduces the vault + links pages.
- Non-functional: nav is a small client component; pages are server components;
  reuse doc-ui; < 200 lines/file.

## Architecture
- `app/docs/layout.tsx` (NEW): server component rendering the sticky header
  (BrandMark + "Tài liệu" + "Quay lại vault" link, reused from doc-shell) + a
  `<DocsNav />` (client) on the left + `<main>` for children. Grid like the current
  shell (`max-w-[1080px]`, `lg:grid-cols-[210px_1fr]`).
- `components/docs/docs-nav.tsx` (NEW, "use client"): the route list
  `[{ href:"/docs", label:"Tổng quan" }, { "/docs/bao-mat","Bảo mật" },
  { "/docs/tinh-nang","Tính năng" }, { "/docs/trien-khai","Triển khai" },
  { "/docs/khoi-phuc","Khôi phục & FAQ" }]`, each a `<Link>`; active via
  `usePathname()` (exact match for "/docs", startsWith for the rest). Active style =
  `bg-azure/[0.08] text-snow`. Hidden `<lg`? Keep a simple horizontal/scrollable nav
  on mobile, or `hidden lg:flex` + a top row of links - keep simple.
- `app/docs/page.tsx`: "Tổng quan" - what a zero-knowledge vault is, the high-level
  flow (reuse a small diagram), and an index linking the 4 other pages.

## Related Code Files
- Create: `app/docs/layout.tsx`, `components/docs/docs-nav.tsx`
- Modify: `app/docs/page.tsx` (becomes the Tổng quan index)
- Reuse: `components/docs/doc-ui.tsx`, `doc-diagram.tsx`

## Implementation Steps
1. Write `docs-nav.tsx` (client, pathname-active).
2. Write `layout.tsx` (header + nav + main grid).
3. Rewrite `app/docs/page.tsx` as the Tổng quan index.
4. Build -> `/docs` renders in the shell with the nav.

## Success Criteria
- [ ] `/docs` renders inside the shell; nav shows "Tổng quan" active.
- [ ] Nav links exist for all 5 pages (later pages 404 until created - fine mid-build).

## Risk Assessment
- `usePathname()` is client-only -> keep it inside `docs-nav.tsx` ("use client");
  layout + pages stay server components.
- Active matching: "/docs" must be EXACT (else it matches every subroute).
