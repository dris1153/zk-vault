---
title: "Database Item Type (with engine picker)"
status: completed
priority: P2
created: 2026-06-05
feature: New `database` vault type with structured fields + an engine picker (logo)
blockedBy: []
blocks: []
---

# Database Item Type - Plan

A new vault item type `database` for storing DB credentials (multiple DBs, each
with its own password), with structured fields + an engine picker (Supabase /
PostgreSQL / MySQL / ...) that shows the engine logo.

## Locked decisions
- Fields: title, **engine** (new `db_engine` kind), host, port, database, username,
  password (secret), notes, tags. `cardSubtitle` = `engine · host`.
- `db_engine` = a native styled `<select>` (choose by text) + the SELECTED engine's
  **logo** shown beside it (HTML select cannot render logos inside options - KISS,
  no custom dropdown). Logo also shows in the detail drawer.
- NO connection_string (YAGNI).
- Engine logos from the `developer-icons` package; fallback Phosphor `Database`.
- Crypto + item storage untouched (arbitrary encrypted JSON per type).

## Phases
| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Migration (CHECK + 0002) + types union | ✅ completed | [phase-01-migration-type.md](./phase-01-migration-type.md) |
| 2 | db-engines registry + item-fields + icons | ✅ completed | [phase-02-fields-registry.md](./phase-02-fields-registry.md) |
| 3 | engine-select + item-form + detail-drawer | ✅ completed | [phase-03-ui.md](./phase-03-ui.md) |
| 4 | Verify (tsc/guard/build + manual) | ✅ completed | [phase-04-verify.md](./phase-04-verify.md) |

## Dependencies
1 -> 2 -> 3; 4 last.

## Acceptance
- `database` shows in the sidebar + the New item type picker.
- Creating a database item with an engine saves; the card shows `engine · host`;
  the drawer shows the engine logo + structured fields; password masked.
- `tsc` clean, `guard` passes, `build` passes, no em-dashes.
- Existing items unaffected.

## Migration (must apply to the live DB)
`vault_items.type` has a CHECK constraint. Add `'database'`:
- Update the inline CHECK in `0001_init.sql` (fresh `db:reset`).
- `0002_add_database_type.sql`: `ALTER TABLE vault_items DROP CONSTRAINT
  vault_items_type_check, ADD CONSTRAINT vault_items_type_check CHECK (type IN
  (...,'database'));` (verify the constraint name).
- ⚠️ The user MUST run this on their live Supabase (SQL editor or `db:reset`)
  BEFORE saving a database item, or the insert is rejected by the constraint.

## Risks (brutal honesty)
- Engine logo cannot appear inside the native `<select>` option list (HTML limit) -
  shows only for the selected value; per-option logos need a custom dropdown (deferred).
- The CHECK migration MUST be applied to the live DB or inserts fail.
- `type` is a plaintext column, so "database" is server-visible like every other
  type (not a security regression).
- Some engines may be missing from `developer-icons` -> fall back to Phosphor Database.
