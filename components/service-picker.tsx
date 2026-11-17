"use client";

// API-key service picker, mirroring the platform picker: trigger (logo + name),
// panel with search + category chips + grouped grid, and a custom free-text
// fallback. Stores the picked service NAME (or custom text). Robust close.

import { useEffect, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass, Cube } from "@phosphor-icons/react/dist/ssr";
import {
  SERVICES,
  SERVICE_CATEGORY_ORDER,
  SERVICE_CATEGORY_LABELS,
  findServiceByName,
  type Service,
  type ServiceCategory,
} from "@/lib/ui/services";
import { ServiceIcon } from "./service-icon";
import { TextInput } from "./ui-kit";

export function ServicePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const known = findServiceByName(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ServiceCategory | "all">("all");
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || (!!value && !known);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const groups = SERVICE_CATEGORY_ORDER.filter((c) => cat === "all" || c === cat)
    .map((c) => ({
      cat: c,
      items: SERVICES.filter((s) => s.category === c && matches(s, query)),
    }))
    .filter((g) => g.items.length > 0);

  const pick = (s: Service) => {
    onChange(s.name);
    setCustomOpen(false);
    setOpen(false);
    setQuery("");
    setCat("all");
  };

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-transparent bg-inset px-3 py-2.5 text-left text-sm text-ink transition hover:bg-line/70 focus:border-line focus:bg-surface"
      >
        {value ? (
          <>
            <ServiceIcon service={value} size={18} />
            <span className="truncate">{known ? known.name : value}</span>
          </>
        ) : (
          <>
            <Cube size={18} className="text-ink-2" />
            <span className="text-ink-2">Chọn dịch vụ</span>
          </>
        )}
        <CaretDown size={15} className="ml-auto shrink-0 text-ink-2" />
      </button>

      {open && (
        <div className="rounded-xl border border-line bg-surface p-2 shadow-card">
          <div className="relative mb-2">
            <MagnifyingGlass
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm dịch vụ..."
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
              data-bwignore=""
              data-form-type="other"
              className="w-full rounded-lg border border-transparent bg-inset py-2 pl-8 pr-2 text-sm text-ink placeholder:text-faint focus:border-ink/30 focus:bg-surface"
            />
          </div>

          <div className="mb-2 flex flex-wrap gap-1">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>
              Tất cả
            </Chip>
            {SERVICE_CATEGORY_ORDER.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {SERVICE_CATEGORY_LABELS[c]}
              </Chip>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted">
                Không tìm thấy dịch vụ.
              </div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.cat}
                  className="mb-1 grid grid-cols-2 gap-1 sm:grid-cols-3"
                >
                  {cat === "all" && (
                    <div className="col-span-full px-2 pt-1 text-[11px] uppercase tracking-[0.1em] text-muted">
                      {SERVICE_CATEGORY_LABELS[g.cat]}
                    </div>
                  )}
                  {g.items.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pick(s)}
                      title={s.name}
                      className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink transition hover:bg-inset"
                    >
                      <span className="shrink-0">
                        <ServiceIcon service={s.name} size={18} />
                      </span>
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="my-1.5 h-px bg-line" />
          <button
            type="button"
            onClick={() => {
              setCustomOpen(true);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-ink transition hover:bg-inset"
          >
            <Cube size={18} /> Dịch vụ khác
          </button>
        </div>
      )}

      {showCustom && (
        <TextInput
          value={value}
          placeholder="Tên dịch vụ"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs transition ${
        active
          ? "bg-ink font-medium text-white"
          : "bg-inset text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function matches(s: Service, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return s.name.toLowerCase().includes(q) || s.id.includes(q);
}
