"use client";

// Database engine picker: a custom dropdown showing each engine's logo + name
// (a native <select> cannot render logos in its option list). In-flow panel +
// robust close (outside pointerdown + Escape), mirroring the platform picker.

import { useEffect, useRef, useState } from "react";
import { CaretDown, Database } from "@phosphor-icons/react/dist/ssr";
import { DB_ENGINES, engineIcon, engineLabel } from "@/lib/ui/db-engines";

export function EngineSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const Selected = engineIcon(value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-left text-sm text-snow transition focus:border-azure"
      >
        {value ? (
          <>
            <Selected size={18} />
            <span className="truncate">{engineLabel(value)}</span>
          </>
        ) : (
          <>
            <Database size={18} className="text-smoke" />
            <span className="text-smoke">Chọn engine</span>
          </>
        )}
        <CaretDown size={15} className="ml-auto shrink-0 text-smoke" />
      </button>

      {open && (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-charcoal bg-ash p-1.5">
          {DB_ENGINES.map((e) => {
            const Icon = e.Icon;
            const active = e.value === value;
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => pick(e.value)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition ${
                  active
                    ? "bg-azure/[0.08] text-snow"
                    : "text-snow hover:bg-obsidian"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{e.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
