---
phase: 2
title: "Manifest + Icons"
status: pending
priority: P2
effort: "1-2h"
dependencies: [1]
---

# Phase 2: Manifest + Icons

## Overview
A web app manifest and the PNG icons (incl. maskable) generated from the existing
vault-cube SVG, plus the theme color.

## Requirements
- Functional: installable manifest with valid 192/512/maskable icons; standalone
  display; dark theme/background.
- Non-functional: icons generated from `app/icon.svg`; committed PNGs.

## Architecture
- `app/manifest.ts` (`export default function manifest(): MetadataRoute.Manifest`):
  - `name: "Vault"`, `short_name: "Vault"`,
    `description: "Personal zero-knowledge credential vault"`,
    `start_url: "/"`, `scope: "/"`, `display: "standalone"`,
    `background_color: "#121212"`, `theme_color: "#121212"`,
    `icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" }, { 512 any }, { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }]`.
- Icons (generate from `app/icon.svg` - the gradient vault-cube tile):
  - `public/icons/icon-192.png`, `public/icons/icon-512.png` (rounded tile is fine).
  - `public/icons/icon-512-maskable.png`: a FULL-BLEED gradient square (no rounded
    corners) with the cube centered in the ~80% safe zone (so the OS mask never
    clips the mark).
  - `app/apple-icon.png` (180x180; Next auto-links it for iOS).
  - Generate via `sharp` (npm: `sharp().png()` rasterizing the SVG) OR ImageMagick
    `convert`/`magick`. A one-off `scripts/gen-icons.mjs` is acceptable; commit the PNGs.
- `app/layout.tsx`: `export const viewport: Viewport = { themeColor: "#121212" };`

## Related Code Files
- Create: `app/manifest.ts`, `public/icons/*.png`, `app/apple-icon.png`,
  (optional) `scripts/gen-icons.mjs`
- Modify: `app/layout.tsx` (viewport themeColor)

## Implementation Steps
1. Decide the rasterizer (sharp if installable, else ImageMagick); render the SVG.
2. Produce icon-192/512 (rounded tile) + icon-512-maskable (full-bleed square) + apple-icon 180.
3. Write `app/manifest.ts` referencing them.
4. Add `viewport.themeColor` to the layout.
5. Build -> confirm `/manifest.webmanifest` and the icons resolve.

## Success Criteria
- [ ] Manifest serves valid JSON with resolvable icons (192/512/maskable).
- [ ] Maskable icon is full-bleed (mark inside the safe zone).
- [ ] apple-icon + theme color set.

## Risk Assessment
- No rasterizer available -> fall back to ImageMagick (the user environment has it)
  or a tiny sharp script; commit the resulting PNGs so the build never needs the tool.
- Maskable safe-zone -> keep the cube within ~80% center, gradient to the edges.
