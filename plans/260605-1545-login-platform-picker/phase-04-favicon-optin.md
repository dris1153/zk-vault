---
phase: 4
title: "Favicon Opt-In (Settings + CSP)"
status: pending
priority: P3
effort: "0.25d"
dependencies: [1, 3]
---

# Phase 4: Favicon Opt-In (Settings + CSP)

## Overview
Optional favicons for custom domains, OFF by default. When enabled, custom-domain
icons load from a favicon provider (leaks the domain to a third party) - gated by
a setting + a minimal CSP allowance.

## Requirements
- Functional: a `fetchFavicons` setting (default false); when true, PlatformIcon
  renders the domain favicon for custom (unresolved) domains, with monogram
  fallback on load error. Settings UI shows a clear privacy warning.
- Non-functional: zero network when off; only one extra `img-src` origin added.

## Architecture
- `lib/vault/settings.ts`: add `fetchFavicons: boolean` to `VaultSettings` +
  `DEFAULT_SETTINGS.fetchFavicons = false`.
- `lib/vault/settings-store.ts`: nothing structural (it already spreads settings).
- `components/settings-dialog.tsx` (Security tab): a toggle "Hiện favicon cho
  domain tùy chỉnh" with sub-text warning it leaks the domain to a third party.
- `components/platform-icon.tsx`: when `favicon` prop true AND no platform match
  AND a domain exists, render `<img src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}>`
  with `onError` -> monogram. Callers (card/drawer) pass
  `favicon={useSettings(s => s.settings.fetchFavicons)}`.
- `next.config.ts`: add `https://icons.duckduckgo.com` to the CSP `img-src`
  directive (documented: needed only when the opt-in is enabled).

## Related Code Files
- Modify: `lib/vault/settings.ts`
- Modify: `components/settings-dialog.tsx`
- Modify: `components/platform-icon.tsx`
- Modify: `components/item-card.tsx`, `components/detail-drawer.tsx` (pass favicon flag)
- Modify: `next.config.ts` (img-src += icons.duckduckgo.com)

## Implementation Steps
1. Add the setting + default false.
2. Add the Security-tab toggle + warning copy (no em-dashes).
3. PlatformIcon: favicon branch with monogram onError fallback.
4. Thread the flag from card/drawer via `useSettings`.
5. Add the provider origin to CSP img-src; note the trade-off in a comment.

## Success Criteria
- [ ] Default: no favicon request anywhere (verify Network tab is clean).
- [ ] Enabled: custom-domain favicon loads; broken favicon falls back to monogram.
- [ ] CSP img-src includes icons.duckduckgo.com; build passes.

## Risk Assessment
- Privacy leak is the whole point of opt-in -> warning copy must be explicit.
- A failed favicon must never leave a broken image -> onError monogram fallback.
