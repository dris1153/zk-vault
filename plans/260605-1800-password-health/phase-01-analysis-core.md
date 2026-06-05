---
phase: 1
title: "Analysis Core"
status: pending
priority: P2
effort: "2-3h"
dependencies: []
---

# Phase 1: Analysis Core

## Overview
The offline analysis module: reused, weak (lazy zxcvbn-ts), and old checks over
login items, returning a typed `HealthReport`. zxcvbn stays behind a lazy import.

## Requirements
- Functional: detect reused/weak/old; return grouped results + counts + a score.
- Non-functional: zxcvbn lazy-imported (out of the critical bundle); client-only;
  no crypto/vault internals; < 200 lines.

## Architecture
- `lib/vault/password-health.ts`:
  - Types: `interface Entry { id: string; title: string; username?: string }`,
    `interface ReuseGroup { password masked?: never; items: Entry[] }` (do NOT store
    the plaintext password in the report - just the member entries),
    `interface HealthReport { reused: Entry[][]; weak: Entry[]; old: Entry[]; breached: Entry[]; totalIssues: number; score: number }`.
  - `loginEntries(items)` -> only `type === "login"` with non-empty `data.password`,
    mapping to `{ entry, password, updatedAt }`.
  - `findReused(rows)` -> group by password value; return groups with length >= 2 (as `Entry[][]`).
  - `findOld(rows, maxAgeDays = 365)` -> `Date.now() - Date(updatedAt) > maxAge`.
  - `findWeak(rows)` (async): lazy `const { zxcvbn, zxcvbnOptions } = await import("@zxcvbn-ts/core")`,
    `const common = await import("@zxcvbn-ts/language-common")`,
    `const en = await import("@zxcvbn-ts/language-en")`; `zxcvbnOptions.setOptions({ dictionary: {...common.default.dictionary, ...en.default.dictionary}, graphs: common.default.adjacencyGraphs, translations: en.default.translations })` (set once, guard with a module flag); score each unique password; weak = `score < 3`.
  - `analyzePasswordHealth(items, opts: { breach?: boolean } = {}): Promise<HealthReport>`
    - compute reused + old (sync) + weak (await findWeak); breached handled in Phase 2
      (call its module when `opts.breach`). `totalIssues = reused.flat unique + weak + old + breached` (dedupe an item counted once per category is fine; total can be a simple sum of distinct issue rows). `score` = a simple 0-100 from issue ratio.
  - Memoize the zxcvbn-options init so repeated calls do not re-import/re-set.

## Related Code Files
- Create: `lib/vault/password-health.ts`
- Modify: `package.json` (add `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`, `@zxcvbn-ts/language-en`)

## Implementation Steps
1. Install the three zxcvbn-ts packages.
2. `loginEntries`, `findReused`, `findOld`.
3. `findWeak` with the lazy import + one-time `setOptions`.
4. `analyzePasswordHealth` (no breach yet) + `score`/`totalIssues`.
5. Sanity: a list with two identical passwords -> 1 reused group; a "123456" ->
   weak; an item with an old `updatedAt` -> old.

## Success Criteria
- [ ] Reused/weak/old detected correctly over a sample.
- [ ] zxcvbn imported lazily (verified later in the build split).
- [ ] Report never includes plaintext passwords.
- [ ] No crypto/vault-internal imports.

## Risk Assessment
- zxcvbn-ts option shape (dictionary/graphs/translations) -> verify against the
  installed package; guard the one-time init.
- Large vault strength cost -> score unique passwords only (dedupe first).
