---
phase: 3
title: "Update Prompt"
status: pending
priority: P2
effort: "1-2h"
dependencies: [1]
---

# Phase 3: Update Prompt

## Overview
Register the service worker on the client and show a "new version, reload" prompt
when a new SW is waiting (user-controlled update, no mid-session disruption).

## Requirements
- Functional: register `/sw.js`; when a new SW is waiting, show a toast with a
  "Tải lại" action that activates it and reloads.
- Non-functional: client-only; only registers in production (SW absent in dev);
  DESIGN.md tokens; no em-dashes.

## Architecture
- `components/pwa-update.tsx` ('use client'):
  - `import { Serwist } from "@serwist/window";`
  - On mount (effect): if `"serviceWorker" in navigator` and not dev, create
    `const sw = new Serwist("/sw.js", { scope: "/" });` then
    `sw.addEventListener("waiting", () => setUpdateReady(true));` and `sw.register();`.
  - `addEventListener("controlling", () => window.location.reload());` so the reload
    happens once the new SW takes control.
  - On "Tải lại" click: `sw.messageSkipWaiting();` (Serwist sends SKIP_WAITING; the
    SW's message handler calls `self.skipWaiting()`), then the `controlling` event
    triggers the reload.
  - Render a small fixed bottom toast (DESIGN.md: ash bg, charcoal border, azure
    action) only when `updateReady`. Copy: "Có bản cập nhật mới" + "Tải lại".
  - Guard: do nothing when `process.env.NODE_ENV === "development"`.
- `app/layout.tsx`: mount `<PwaUpdate />` inside `<body>` (after VaultProvider).

## Related Code Files
- Create: `components/pwa-update.tsx`
- Modify: `app/layout.tsx`

## Implementation Steps
1. Build `pwa-update.tsx` (register + waiting/controlling handlers + toast).
2. Mount it in the layout.
3. Verify it registers in a production build and does nothing in dev.

## Success Criteria
- [ ] SW registers in production; no errors in dev (registration skipped).
- [ ] A waiting SW surfaces the toast; "Tải lại" activates + reloads.
- [ ] Toast matches DESIGN.md, dark-only, no em-dashes.

## Risk Assessment
- `@serwist/window` API surface -> verify the exact event names (`waiting`,
  `controlling`) and `messageSkipWaiting()` against the installed version.
- Double-reload loops -> reload only on the `controlling` event after an explicit
  skip-waiting, not on first install.
