"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, MagnifyingGlass, Globe } from "@phosphor-icons/react/dist/ssr";
import {
  PLATFORMS,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  findPlatform,
  type Platform,
  type PlatformCategory,
} from "@/lib/ui/platforms";
import { PlatformIcon } from "./platform-icon";
import { TextInput } from "./ui-kit";

export function PlatformPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const platform = findPlatform(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<PlatformCategory | "all">("all");
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || (!!value && !platform);
  const rootRef = useRef<HTMLDivElement>(null);

  // Robust close: outside pointerdown + Escape (not a fragile fixed overlay).
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

  const groups = CATEGORY_ORDER.filter((c) => cat === "all" || c === cat)
    .map((c) => ({
      cat: c,
      items: PLATFORMS.filter((p) => p.category === c && matches(p, query)),
    }))
    .filter((g) => g.items.length > 0);

  const pick = (p: Platform) => {
    onChange(p.domains[0]);
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
        className="flex w-full items-center gap-2.5 rounded-lg border border-slate bg-obsidian px-3 py-2.5 text-left text-sm text-snow transition focus:border-azure"
      >
        {platform ? (
          <>
            <PlatformIcon platform={platform} size={18} />
            <span className="truncate">{platform.name}</span>
          </>
        ) : value ? (
          <>
            <PlatformIcon url={value} size={18} />
            <span className="truncate text-silver">{value}</span>
          </>
        ) : (
          <>
            <Globe size={18} className="text-smoke" />
            <span className="text-smoke">Chọn nền tảng</span>
          </>
        )}
        <CaretDown size={15} className="ml-auto shrink-0 text-smoke" />
      </button>

      {open && (
        <div className="rounded-lg border border-charcoal bg-ash p-1.5">
          <div className="relative mb-1.5">
            <MagnifyingGlass
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-smoke"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nền tảng..."
              className="w-full rounded-md border border-slate bg-obsidian py-2 pl-8 pr-2 text-sm text-snow outline-none placeholder:text-smoke focus:border-azure"
            />
          </div>

          <div className="mb-1.5 flex flex-wrap gap-1">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>
              Tất cả
            </Chip>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {CATEGORY_LABELS[c]}
              </Chip>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-smoke">
                Không tìm thấy nền tảng.
              </div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.cat}
                  className="mb-1 grid grid-cols-2 gap-1 sm:grid-cols-3"
                >
                  {cat === "all" && (
                    <div className="col-span-full px-2 pt-1 text-[11px] uppercase tracking-[0.1em] text-smoke">
                      {CATEGORY_LABELS[g.cat]}
                    </div>
                  )}
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      title={p.name}
                      className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-snow transition hover:bg-obsidian"
                    >
                      <span className="shrink-0">
                        <PlatformIcon platform={p} size={18} />
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          <div className="my-1 h-px bg-charcoal" />
          <button
            type="button"
            onClick={() => {
              setCustomOpen(true);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-azure-link transition hover:bg-obsidian"
          >
            <Globe size={18} /> URL tùy chỉnh
          </button>
        </div>
      )}

      {showCustom && (
        <TextInput
          value={value}
          placeholder="https://example.com"
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
          ? "bg-azure font-medium text-[#08233f]"
          : "bg-obsidian text-silver hover:text-snow"
      }`}
    >
      {children}
    </button>
  );
}

function matches(p: Platform, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.id.includes(q) ||
    p.domains.some((d) => d.includes(q))
  );
}
