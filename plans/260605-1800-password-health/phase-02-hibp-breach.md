---
phase: 2
title: "HIBP Breach + Setting + CSP"
status: pending
priority: P3
effort: "1-2h"
dependencies: [1]
---

# Phase 2: HIBP Breach + Setting + CSP

## Overview
Opt-in breach check via Have I Been Pwned k-anonymity, gated by a setting and a
CSP allowance. Off by default to preserve zero-knowledge.

## Requirements
- Functional: when enabled, report which login passwords appear in HIBP, using
  the k-anonymity range API (only a 5-char hash prefix leaves the device).
- Non-functional: default OFF; one extra `connect-src` origin; dedupe + cache.

## Architecture
- In `lib/vault/password-health.ts` (or a small `hibp` helper in the same module):
  - `pwnedCount(password: string): Promise<number>`
    - `hash = uppercase hex of SHA-1(password)` via `crypto.subtle.digest("SHA-1", utf8(password))`.
    - `prefix = hash.slice(0,5)`, `suffix = hash.slice(5)`.
    - `fetch("https://api.pwnedpasswords.com/range/" + prefix)` -> text; split lines
      `SUFFIX:COUNT`; find `suffix` (case-insensitive) -> count, else 0.
    - In-memory `Map<password, number>` cache for the session.
  - `findBreached(rows): Promise<Entry[]>` -> dedupe unique passwords, `pwnedCount`
    each (sequential or small concurrency), entries with count > 0.
  - `analyzePasswordHealth(..., { breach: true })` calls `findBreached`.
- `lib/vault/settings.ts` + `settings-store`: add `breachCheckEnabled: boolean` (default false).
- `next.config.ts`: add `https://api.pwnedpasswords.com` to the CSP `connect-src`
  (document: only used when the opt-in is enabled).

## Related Code Files
- Modify: `lib/vault/password-health.ts`, `lib/vault/settings.ts`, `next.config.ts`

## Implementation Steps
1. `pwnedCount` (SHA-1 + range fetch + parse) + session cache.
2. `findBreached` (dedupe + map) + wire into `analyzePasswordHealth`.
3. Add the setting (default false).
4. Add the CSP `connect-src` origin.

## Success Criteria
- [ ] With breach off: zero network requests anywhere.
- [ ] With breach on: only k-anonymity prefix requests to pwnedpasswords; a known
  pwned test password ("password") reports breached.
- [ ] CSP allows the HIBP origin; build passes.

## Risk Assessment
- Privacy: a 5-char prefix + the fact you are checking leaves the device -> opt-in
  + a clear warning (Phase 3 UI).
- Rate limits: dedupe by unique password + cache; personal scale is small.
- A network failure must not break the rest of the report -> catch per password,
  treat as "unknown" (not breached).
