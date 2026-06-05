// Database engine registry: value + label + logo. Logos come from the bundled
// `developer-icons` package; engines without a logo fall back to a Phosphor icon.

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

export interface DbEngine {
  value: string;
  label: string;
  Icon: IconComp;
}

export const DB_ENGINES: DbEngine[] = [
  { value: "supabase", label: "Supabase", Icon: Supabase },
  { value: "postgres", label: "PostgreSQL", Icon: PostgreSQL },
  { value: "mysql", label: "MySQL", Icon: MySQL },
  { value: "mariadb", label: "MariaDB", Icon: MariaDB },
  { value: "mongodb", label: "MongoDB", Icon: MongoDB },
  { value: "redis", label: "Redis", Icon: Redis },
  { value: "mssql", label: "SQL Server", Icon: MicrosoftSQLServer },
  { value: "sqlite", label: "SQLite", Icon: Database }, // no logo in developer-icons
  { value: "other", label: "Other", Icon: Database },
];

const BY_VALUE = new Map(DB_ENGINES.map((e) => [e.value, e]));

export function engineIcon(value: string): IconComp {
  return BY_VALUE.get(value)?.Icon ?? Database;
}

export function engineLabel(value: string): string {
  return BY_VALUE.get(value)?.label ?? value;
}
