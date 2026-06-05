---
phase: 1
title: "Platform Registry + Icon Resolution"
status: pending
priority: P2
effort: "0.5d"
dependencies: []
---

# Phase 1: Platform Registry + Icon Resolution

## Overview
The data + presentation foundation: a static platform registry, domain
resolution helpers, and a `PlatformIcon` component (svg-component | png |
monogram). No network by default.

## Requirements
- Functional: list ~25 platforms with multi-domain matching; resolve a platform
  from any URL; render its icon, or a deterministic monogram for unknown domains.
- Non-functional: icons bundled (no CDN), zero network by default, < 200 lines/file.

## Architecture
- `lib/ui/platforms.ts`:
  - `type PlatformCategory = 'popular'|'dev'|'social'|'messaging'|'google'|'finance'|'other'`
  - `type PlatformIconRef = { kind:'svg'; Comp: ComponentType<{size?:number}> } | { kind:'png'; src:string }`
  - `interface Platform { id; name; category; domains: string[]; icon: PlatformIconRef }`
  - `PLATFORMS: Platform[]` seeded (~25). developer-icons components where available; `{kind:'png', src:'/brand/<id>.png'}` for the rest (zalo, messenger, ...).
  - `domainOf(url: string): string` - lowercase hostname, strip leading `www.`; tolerate bare domains (no scheme) and full URLs.
  - `findPlatform(url: string): Platform | null` - match `domainOf` against every entry's `domains[]`, subdomain-aware (`host === d || host.endsWith('.'+d)`).
  - `CATEGORY_LABELS: Record<PlatformCategory,string>` + `CATEGORY_ORDER`.
- `components/platform-icon.tsx` ('use client' only if it uses favicon state; otherwise server-safe):
  - Props `{ platform?: Platform | null; url?: string; size?: number; favicon?: boolean }`.
  - If `platform`: render svg Comp or `<img src=png>`.
  - Else if `url` present: monogram (favicon handled in Phase 4; here just monogram).
  - Monogram: first alpha char of domain, bg color from a hash of the domain (HSL), foreground snow. Rounded square matching DESIGN.md.
- `public/brand/*.png`: blank/placeholder PNGs for brands not in developer-icons (zalo, messenger, ... whatever is missing). User replaces later.

## Related Code Files
- Create: `lib/ui/platforms.ts`
- Create: `components/platform-icon.tsx`
- Create: `public/brand/<id>.png` (placeholders)
- Modify: `package.json` (add `developer-icons`)

## Implementation Steps
1. `npm install developer-icons`. Inspect its exports (named brand components) to know which platforms get svg vs png.
2. Write `platforms.ts` registry + helpers. Map each platform's icon (svg Comp from developer-icons, or png ref).
3. Create placeholder PNGs in `public/brand/` for missing brands (1x1 or simple blank PNG; user replaces).
4. Write `platform-icon.tsx` with svg/png/monogram rendering. Monogram color = deterministic hash(domain) -> HSL.
5. Sanity: `findPlatform('github.com')`, `findPlatform('https://www.github.com/x')`, `findPlatform('unknown.xyz')` behave correctly.

## Success Criteria
- [ ] Registry resolves known domains (incl. subdomains, bare + full URLs).
- [ ] PlatformIcon renders svg / png / monogram without any network call.
- [ ] developer-icons bundled; build has no CDN/runtime icon fetch.

## Risk Assessment
- developer-icons export names differ per brand -> verify against the installed package; fall back to png if a brand is absent.
- Placeholder PNGs must exist or `<img>` 404s -> create them in this phase.
