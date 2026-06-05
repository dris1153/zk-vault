---
phase: 2
title: "Engine registry + fields + icons"
status: pending
priority: P2
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Engine registry + fields + icons

## Overview
The engine registry (logos), the `db_engine` field kind, the `database` field
layout + card subtitle, and the sidebar/type icon + label + order.

## Requirements
- Functional: `DB_ENGINES` with logos; `database` fields defined; card subtitle;
  type icon/label/order present so the category + picker show up.
- Non-functional: lowercase stable engine values; fallback icon for missing logos.

## Architecture
- `lib/ui/db-engines.ts` (new):
  - `import` from `developer-icons` the available engine logos (verify names at
    cook: e.g. `PostgreSql`/`PostgreSQL`, `MySQL`, `MariaDB`, `MongoDB`, `Redis`,
    `Supabase`, `SQLite`, `MicrosoftSqlServer`). For any missing, fall back.
  - `DB_ENGINES: { value: string; label: string; Icon: IconComp }[]` with values
    `supabase, postgres, mysql, mariadb, mongodb, redis, mssql, sqlite, other`.
  - `engineIcon(value): IconComp` -> the engine's Icon or Phosphor `Database`.
  - `engineLabel(value): string` -> label or the raw value.
- `lib/ui/item-fields.ts`:
  - `FieldKind` += `'db_engine'`.
  - (Optional) `FieldDef.options?: string[]` - not needed if EngineSelect reads
    `DB_ENGINES` directly; keep FieldDef minimal.
  - `FIELDS_BY_TYPE.database = [ title, {name:"engine",label:"Engine",kind:"db_engine"},
    {name:"host",label:"Host",kind:"text"}, {name:"port",label:"Port",kind:"text"},
    {name:"database",label:"Database",kind:"text"},
    {name:"username",label:"Username",kind:"text"},
    {name:"password",label:"Password",kind:"secret"}, notes, tags ]`.
  - `cardSubtitle` `case "database"`: `[engineLabel(engine), host].filter(Boolean).join(" · ")`.
- `lib/ui/icons.ts`: `TYPE_ICON.database = Database` (Phosphor), `TYPE_LABEL.database = "Database"`,
  add `"database"` to `TYPE_ORDER` (e.g. after `ssh_key`).

## Related Code Files
- Create: `lib/ui/db-engines.ts`
- Modify: `lib/ui/item-fields.ts`, `lib/ui/icons.ts`

## Implementation Steps
1. Build `db-engines.ts` (verify developer-icons exports; fallback for missing).
2. Add the `db_engine` kind + `FIELDS_BY_TYPE.database` + `cardSubtitle` case.
3. Add the type to `TYPE_ICON`/`TYPE_LABEL`/`TYPE_ORDER`.

## Success Criteria
- [ ] `DB_ENGINES` resolves an Icon for every value (real logo or fallback).
- [ ] tsc no longer complains about a missing `database` key in the maps.
- [ ] cardSubtitle returns `engine · host`.

## Risk Assessment
- developer-icons export names differ from guesses -> verify imports; fallback
  keeps the build green even if a logo is missing.
- TYPE_LABEL pluralization: the sidebar appends "s" (Database -> Databases) - fine.
