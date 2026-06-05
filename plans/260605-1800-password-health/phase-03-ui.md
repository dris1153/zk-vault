---
phase: 3
title: "Hook + Modal + Wiring"
status: pending
priority: P2
effort: "2-3h"
dependencies: [1, 2]
---

# Phase 3: Hook + Modal + Wiring

## Overview
A reactive hook over the analysis, a sidebar entry with an issue badge, and a
panel (modal) listing the issues - each row opening the item in the drawer.

## Requirements
- Functional: badge of total issues in the sidebar; a modal with grouped lists
  (reused/weak/old/breached) + a healthy empty state; row click opens the drawer;
  HIBP runs only when enabled AND the modal is open.
- Non-functional: zxcvbn loads lazily (only when analysis runs); < 200 lines/file.

## Architecture
- `lib/vault/use-password-health.ts` ('use client'):
  - `usePasswordHealth(opts: { breach: boolean }): { report: HealthReport | null; loading: boolean }`.
  - Reads `useItems((s) => s.items)`; on items/opts change, runs
    `analyzePasswordHealth(items, { breach: opts.breach })` (async) with a cancel
    guard (ignore stale results). Loading true while running.
- `components/security-check-modal.tsx`:
  - Props `{ open; onClose; report; loading; onOpenItem(id) }`.
  - Header + summary (score + counts). Sections: Reused (each group), Weak, Old,
    Breached (only when enabled). Each row: item icon/title/username + a small tag;
    onClick -> `onOpenItem(id)`. Healthy state when `totalIssues === 0`.
- `components/sidebar.tsx`: add a "Kiểm tra bảo mật" button (Phosphor ShieldCheck)
  near Settings, with a badge of `totalIssues` (azure pill) when > 0. New prop
  `onOpenSecurity` + `issueCount`.
- `components/app-shell.tsx`:
  - `const breach = useSettings(s => s.settings.breachCheckEnabled)`.
  - `const [securityOpen, setSecurityOpen] = useState(false)`.
  - `const { report, loading } = usePasswordHealth({ breach: breach && securityOpen })`.
  - Pass `issueCount={report?.totalIssues ?? 0}` + `onOpenSecurity={() => setSecurityOpen(true)}` to Sidebar.
  - Render `<SecurityCheckModal open={securityOpen} ... onOpenItem={(id) => { const it = items.find(i => i.id === id); if (it) { setSelected(it); setSecurityOpen(false); } }} />`.
- `components/settings-dialog.tsx` (Security tab): add the `breachCheckEnabled`
  toggle + warning ("gửi 5 ký tự đầu của hash password tới HIBP để kiểm tra rò rỉ").

## Related Code Files
- Create: `lib/vault/use-password-health.ts`, `components/security-check-modal.tsx`
- Modify: `components/sidebar.tsx`, `components/app-shell.tsx`, `components/settings-dialog.tsx`

## Implementation Steps
1. Hook with cancel-guard.
2. Modal UI (summary + sections + healthy state).
3. Sidebar entry + badge.
4. App-shell wiring (state + report + open-item-from-modal).
5. Settings HIBP toggle + warning.
6. Smoke: add reused/weak logins -> badge + lists; click -> drawer; enable HIBP ->
   breached section populates; disable -> no network.

## Success Criteria
- [ ] Badge reflects issue count; panel lists issues; row click opens the drawer.
- [ ] HIBP section only with the setting on + panel open; off -> no requests.
- [ ] Healthy vault -> clean empty state, badge hidden.

## Risk Assessment
- Stale async results when items change fast -> cancel-guard in the hook.
- Recomputation cost -> analysis dedupes unique passwords; fine at personal scale.
