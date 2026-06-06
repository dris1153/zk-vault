// Database engine registry: value + label + logo. Logos come from the bundled
// `developer-icons` package; engines not in that package use a local PNG at
// /engine/<id>.png (mirrors the platform registry). Render with <EngineIcon>.

import type { ComponentType } from "react";
import {
  Supabase,
  PostgreSQL,
  MySQL,
  MariaDB,
  MongoDB,
  Redis,
  MicrosoftSQLServer,
} from "developer-icons";
import { Database } from "@phosphor-icons/react/dist/ssr";

type IconComp = ComponentType<{ size?: number; className?: string }>;

export type EngineIconRef =
  | { kind: "svg"; Comp: IconComp }
  | { kind: "png"; src: string }
  | { kind: "webp"; src: string };

const svg = (Comp: IconComp): EngineIconRef => ({ kind: "svg", Comp });
const png = (id: string): EngineIconRef => ({
  kind: "png",
  src: `/engine/${id}.png`,
});
const webp = (id: string): EngineIconRef => ({
  kind: "webp",
  src: `/engine/${id}.webp`,
});

export interface DbEngine {
  value: string;
  label: string;
  icon: EngineIconRef;
}

export const DB_ENGINES: DbEngine[] = [
  { value: "supabase", label: "Supabase", icon: svg(Supabase) },
  { value: "postgres", label: "PostgreSQL", icon: svg(PostgreSQL) },
  { value: "mysql", label: "MySQL", icon: svg(MySQL) },
  { value: "mariadb", label: "MariaDB", icon: svg(MariaDB) },
  { value: "mongodb", label: "MongoDB", icon: svg(MongoDB) },
  { value: "redis", label: "Redis", icon: svg(Redis) },
  { value: "mssql", label: "SQL Server", icon: svg(MicrosoftSQLServer) },
  { value: "sqlite", label: "SQLite", icon: webp("sqlite") }, // PNG at /engine/sqlite.png
  { value: "other", label: "Other", icon: svg(Database) },
];

const BY_VALUE = new Map(DB_ENGINES.map((e) => [e.value, e]));

/** The icon ref for an engine (Phosphor Database fallback for unknown values). */
export function engineIconRef(value: string): EngineIconRef {
  return BY_VALUE.get(value)?.icon ?? svg(Database);
}

export function engineLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}
