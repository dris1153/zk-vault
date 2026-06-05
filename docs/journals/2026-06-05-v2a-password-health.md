# 2026-06-05 - v2a: Password health check

Shipped the first piece of v2: an offline-first password health check for Login
items (reused / weak / old + opt-in HIBP breach), in a sidebar-opened panel.
Brainstorm -> plan -> cook -> review -> commit on `origin/dev` (`7c536ca`).

## What
- `lib/vault/password-health.ts`: analysis over the in-RAM items.
  - Reused: group logins by password value (>= 2 -> flagged).
  - Weak: zxcvbn-ts score < 3, **lazy-imported** (the ~400KB lives in a separate
    chunk, NOT the critical bundle).
  - Old: `updatedAt` > 1 year (a documented PROXY - it is last item edit, not last
    password change).
  - Breach: HIBP k-anonymity (SHA-1, only the 5-char hex prefix leaves the device),
    OPT-IN, default off, runs only when enabled AND the panel is open.
- Sidebar entry "Kiểm tra bảo mật" with an issue badge; a modal lists the groups;
  clicking an item opens its drawer. Settings has the HIBP toggle; CSP `connect-src`
  allows pwnedpasswords only.

## Zero-knowledge kept
- The HealthReport contains NO plaintext password (only item id/type/title/username).
- HIBP is opt-in; otherwise everything is computed locally with no network.

## Review caught two real issues (fixed)
- The HIBP cache was keyed by the **plaintext password** at module scope -> after
  lock it left plaintext in the heap. Re-keyed by the **hash**.
- Transient HIBP failures were cached as "not breached" (a false-negative that
  hides a real breach for the session). Now only definitive (`res.ok`) results are
  cached; failures retry.
- Also addressed the eager-zxcvbn trade-off: gated `weak` behind the panel being
  opened, so zxcvbn does not download on unlock for users who never open the panel
  (the badge shows reused/old immediately, weak after first open).

## Verification
`tsc` clean, `guard` clean, `build` passes (`/` first-load 274 kB), and zxcvbn is
confirmed in a separate lazy chunk (380 KB in `4a052d25.*.js`, not the page chunk).

## v2 remaining
PWA (installable + precache static for offline + supply-chain mitigation) and,
optionally, nonce-based CSP (still recommend reconsidering - high effort vs static
rendering for a self-hosted personal app). Separate cycles.
