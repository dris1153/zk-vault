---
title: "Password Health Check (v2a)"
status: completed
priority: P2
created: 2026-06-05
feature: Offline-first password health (reused/weak/old + opt-in HIBP) in a sidebar panel
blockedBy: []
blocks: []
---

# Password Health Check (v2a) - Plan

An offline-first health check over Login items: reused, weak, old, and (opt-in,
network) breached passwords, in a sidebar-opened panel. Computed from the
already-decrypted items in RAM (useItems). Zero-knowledge preserved (offline
except the opt-in HIBP check).

## Locked decisions
1. Four checks: **reused** (sync), **weak** (lazy zxcvbn-ts, score < 3), **old**
   (`updatedAt` > 1y, a proxy), **breach** (HIBP k-anonymity, OPT-IN, default off).
2. zxcvbn-ts is **lazy-imported** inside the analysis module - it must NOT land in
   the critical page bundle (loads only when the analysis runs, after unlock).
3. HIBP is opt-in (a setting) + a CSP `connect-src` allowance; runs only when
   enabled AND the panel is open. Dedupe by unique password; cache per session.
4. Scope: login items with a non-empty `data.password`. No schema change.
5. Do NOT touch lib/crypto or the vault engine.

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Analysis core (reused/weak-lazy/old) + deps | ✅ completed | [phase-01-analysis-core.md](./phase-01-analysis-core.md) |
| 2 | HIBP breach + setting + CSP | ✅ completed | [phase-02-hibp-breach.md](./phase-02-hibp-breach.md) |
| 3 | Hook + modal + sidebar/app-shell wiring | ✅ completed | [phase-03-ui.md](./phase-03-ui.md) |
| 4 | Verify (tsc/guard/build + lazy split) | ✅ completed | [phase-04-verify.md](./phase-04-verify.md) |

## Dependencies
1 -> 2, 1 -> 3 (2 and 3 both use the analysis); 4 last.

## Acceptance
- Sidebar "Kiểm tra bảo mật" shows a badge of total issues; the panel lists
  reused/weak/old (+ breached when enabled); clicking an item opens its drawer.
- zxcvbn is a separate lazy chunk (NOT in the main page bundle).
- HIBP off by default; on -> queries pwnedpasswords with k-anonymity only.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.

## Risks (brutal honesty)
- "Old" uses `updatedAt` (last edit), NOT last password change - a soft proxy.
- HIBP leaks a 5-char hash prefix + the fact you are checking -> opt-in + warned.
- zxcvbn bundle (~400KB) -> lazy-load; never block unlock.

## Next (separate cycles, NOT planned here)
v2 also includes **PWA** (installable + precache static for offline + supply-chain
mitigation) and optionally **nonce-based CSP** (high effort; tension with static
rendering - may be dropped). Each gets its own brainstorm/plan.
