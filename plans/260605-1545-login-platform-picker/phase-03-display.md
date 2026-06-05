---
phase: 3
title: "Display Updates (Card + Drawer)"
status: pending
priority: P2
effort: "0.25d"
dependencies: [1, 2]
---

# Phase 3: Display Updates (Card + Drawer)

## Overview
Show the resolved platform logo on login cards and in the detail drawer's URL
row, with monogram fallback for custom domains.

## Requirements
- Functional: login card icon = platform logo (resolved from `url`), else
  monogram (has url, no match), else default login icon (no url). Drawer URL row
  shows platform logo + name beside the value, keeping the open-link button.
- Non-functional: only login type changes; other types keep their type-icon.

## Architecture
- `components/item-card.tsx`: for `item.type === 'login'`, compute
  `findPlatform(item.data.url)`. Render `<PlatformIcon>` (platform | url-monogram)
  in place of the azure type-icon; fall back to the existing `TYPE_ICON.login`
  when there is no url. Non-login items unchanged.
- `components/detail-drawer.tsx`: in the URL row (field.name === 'url'), prepend a
  small `<PlatformIcon size={18}>` and show the platform name (or "Tùy chỉnh") as
  a label; keep the existing reveal/open-link/copy controls. Pass the favicon
  flag (Phase 4) through; for now monogram fallback.

## Related Code Files
- Modify: `components/item-card.tsx`
- Modify: `components/detail-drawer.tsx`

## Implementation Steps
1. item-card: resolve platform for login items; swap the icon; keep masked line.
2. detail-drawer: enhance the URL row with platform icon + name.
3. Visual check: a GitHub login shows the GitHub logo on card + drawer; a custom
   domain shows a monogram; a login with empty url shows the default login icon.

## Success Criteria
- [ ] Login cards show the brand logo when the url resolves; monogram otherwise.
- [ ] Drawer URL row shows logo + platform name + working open-link.
- [ ] Existing items render correctly with no data change (resolution only).

## Risk Assessment
- Icon swap must not break the card layout (same 34-40px slot) -> reuse the
  existing icon container sizing.
