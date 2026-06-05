---
phase: 1
title: "Migration + type union"
status: pending
priority: P2
effort: "0.5h"
dependencies: []
---

# Phase 1: Migration + type union

## Overview
Allow `'database'` as a `vault_items.type` value (CHECK constraint) and add it to
the TypeScript `VaultItemType` union.

## Requirements
- Functional: a `database` row passes the DB CHECK; TS knows the new type.
- Non-functional: fresh `db:reset` includes it; an ALTER exists for live DBs.

## Architecture
- `supabase/migrations/0001_init.sql`: update the inline CHECK on `vault_items.type`
  to include `'database'` (so a fresh `npm run db:reset` is correct).
- `supabase/migrations/0002_add_database_type.sql` (new): for already-deployed DBs:
  ```sql
  alter table vault_items drop constraint vault_items_type_check;
  alter table vault_items add constraint vault_items_type_check
    check (type in ('login','wallet','ssh_key','secure_note','api_key','database'));
  ```
  (Verify the auto-named constraint is `vault_items_type_check`; if Postgres named
  it differently, adjust. Inline unnamed CHECK on column `type` of table
  `vault_items` is conventionally `vault_items_type_check`.)
- `lib/supabase/types.ts`: add `'database'` to the `VaultItemType` union.

## Related Code Files
- Modify: `supabase/migrations/0001_init.sql`, `lib/supabase/types.ts`
- Create: `supabase/migrations/0002_add_database_type.sql`

## Implementation Steps
1. Edit the CHECK in `0001_init.sql`.
2. Write `0002_add_database_type.sql` (ALTER drop+add).
3. Add `'database'` to `VaultItemType`.
4. (User action, not code) apply the migration to live Supabase before saving.

## Success Criteria
- [ ] `VaultItemType` includes `'database'`; tsc errors elsewhere reveal the
  remaining touch points (icons/fields - handled in Phase 2).
- [ ] Migration SQL is syntactically valid.

## Risk Assessment
- Adding to the union makes `Record<VaultItemType, ...>` maps (FIELDS_BY_TYPE,
  TYPE_ICON, TYPE_LABEL) require the `database` key -> expect tsc errors until
  Phase 2 fills them. That is the intended driver.
- Wrong constraint name -> the ALTER fails; verify against the live schema.
