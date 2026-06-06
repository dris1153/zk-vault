"use client";

// Generic custom dropdown matching the design system (replaces native <select>).
// In-flow panel + robust close (outside pointerdown + Escape), mirroring
// engine-select / platform-picker so it is never clipped inside a scrollable modal.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretDown, Check } from "@phosphor-icons/react/dist/ssr";

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: ReactNode; // optional leading icon (e.g. a platform / engine logo)
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

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

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-left text-sm text-snow transition focus:border-azure"
      >
        {selected?.icon && (
          <span className="flex shrink-0 items-center">{selected.icon}</span>
        )}
        <span className="truncate">{selected?.label ?? ""}</span>
        <CaretDown
          size={15}
          className={`ml-auto shrink-0 text-smoke transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-10 left-0 right-0 -bottom-2 flex flex-col gap-1 translate-y-full max-h-72 overflow-y-auto rounded-lg border border-charcoal bg-ash p-1.5"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={String(o.value)}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(o.value)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition ${
                  active
                    ? "bg-azure/8 text-snow"
                    : "text-snow hover:bg-charcoal"
                }`}
              >
                {o.icon && (
                  <span className="flex shrink-0 items-center">{o.icon}</span>
                )}
                <span className="flex-1 truncate">{o.label}</span>
                {active && <Check size={15} className="shrink-0 text-azure" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
