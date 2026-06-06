// Database engine registry: value + label + logo. Logos come from the bundled
// `developer-icons` package; engines not in that package use a local PNG/WEBP at
// /brand/<id>.(png|webp) (shared with platforms/services). Render with <EngineIcon>.

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
import { svg, webp, type BrandIconRef } from "./brand";

export interface DbEngine {
  value: string;
  label: string;
  icon: BrandIconRef;
}

export const DB_ENGINES: DbEngine[] = [
  { value: "supabase", label: "Supabase", icon: svg(Supabase) },
  { value: "postgres", label: "PostgreSQL", icon: svg(PostgreSQL) },
  { value: "mysql", label: "MySQL", icon: svg(MySQL) },
  { value: "mariadb", label: "MariaDB", icon: svg(MariaDB) },
  { value: "mongodb", label: "MongoDB", icon: svg(MongoDB) },
  { value: "redis", label: "Redis", icon: svg(Redis) },
  { value: "mssql", label: "SQL Server", icon: svg(MicrosoftSQLServer) },
  { value: "sqlite", label: "SQLite", icon: webp("sqlite") }, // /brand/sqlite.webp
  { value: "other", label: "Other", icon: svg(Database) },
];

const BY_VALUE = new Map(DB_ENGINES.map((e) => [e.value, e]));

/** The icon ref for an engine (Phosphor Database fallback for unknown values). */
export function engineIconRef(value: string): BrandIconRef {
  return BY_VALUE.get(value)?.icon ?? svg(Database);
}

export function engineLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}
