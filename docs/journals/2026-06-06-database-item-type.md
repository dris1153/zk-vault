# 2026-06-06 - Database item type (engine picker)

Added a new `database` vault item type for storing DB credentials (multiple DBs,
each with its own password), with structured fields and an engine picker that
shows the engine logo. Brainstorm -> plan -> cook -> commit on `origin/dev`
(`d04d4b9`).

## What
- Fields: title, engine, host, port, database, username, password (secret), notes,
  tags. Card subtitle = `engine · host`.
- New `db_engine` field kind: a native `<select>` (choose by text) with the selected
  engine's logo beside it; per-option logos are not possible in a native select, so
  the logo reflects the current selection only (form + drawer). Avoids a custom dropdown.
- `lib/ui/db-engines.ts`: engine registry with logos from `developer-icons`
  (Supabase, PostgreSQL, MySQL, MariaDB, MongoDB, Redis, SQL Server). SQLite + Other
  fall back to the Phosphor Database icon.
- No connection_string field (YAGNI).

## Touch points (and a type-system lesson)
The plan listed types/fields/icons/form/drawer + migration. tsc then surfaced TWO
more `Record<VaultItemType, ...>` maps the plan missed: `lib/vault/schemas.ts`
(the zod schema map) and `lib/vault/items-store.ts` (per-type counts). The
exhaustive `Record<VaultItemType, ...>` typing forced completeness - a good example
of the type system catching an incomplete change.

## Migration
`vault_items.type` has a CHECK constraint. Added `'database'`:
- Updated the inline CHECK in `0001_init.sql` (fresh `db:reset`).
- `0002_add_database_type.sql`: drop+add the constraint for already-deployed DBs.
- The user MUST apply 0002 to their live Supabase before saving a database item,
  or the insert is rejected. Field DATA needs no migration (arbitrary encrypted JSON).

## Security note
`type` is one of the two plaintext columns, so "database" is server-visible like
every other type - not a regression. All field values stay encrypted.

## Verification
`tsc` clean, `guard` clean, `build` passes, no em-dashes. End-to-end (sidebar
category, type picker, create with engine, card subtitle, drawer with engine logo +
masked password) is a manual check after the migration is applied.
