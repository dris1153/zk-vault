"use client";

// Database engine picker: a native <select> (chosen by text) with the selected
// engine's logo shown beside it. Per-option logos are not possible in a native
// <select> (HTML limitation), so the logo reflects the current selection only.

import { DB_ENGINES, engineIcon } from "@/lib/ui/db-engines";

export function EngineSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const Icon = engineIcon(value);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate bg-obsidian pl-3 transition focus-within:border-azure">
      <Icon size={18} className={value ? "" : "text-smoke"} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer bg-transparent py-2.5 pr-3 text-sm text-snow outline-none"
      >
        <option value="" disabled className="bg-obsidian text-smoke">
          Chọn engine
        </option>
        {DB_ENGINES.map((e) => (
          <option key={e.value} value={e.value} className="bg-obsidian text-snow">
            {e.label}
          </option>
        ))}
      </select>
    </div>
  );
}
